import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Client Initialization
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey || '');

  // API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!apiKey) {
        console.error("Critical: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
      }

      // Strict Validation and Sanitization of History
      let validatedHistory: any[] = [];
      const rawHistory = history || [];

      if (rawHistory.length > 0) {
        // Step 1: Filter out messages with empty content
        const cleaned = rawHistory.filter((m: any) => 
          m.role && m.parts && m.parts[0] && m.parts[0].text && m.parts[0].text.trim() !== ""
        );

        // Step 2: Merge consecutive roles to ensure strict moderation
        for (const msg of cleaned) {
          if (validatedHistory.length > 0 && validatedHistory[validatedHistory.length - 1].role === msg.role) {
            // Merge text if role repeats
            validatedHistory[validatedHistory.length - 1].parts[0].text += "\n" + msg.parts[0].text;
          } else {
            validatedHistory.push({
              role: msg.role === 'model' ? 'model' : 'user', // normalize roles
              parts: [{ text: msg.parts[0].text }]
            });
          }
        }
      }

      // Step 3: Ensure history starts with 'user'
      if (validatedHistory.length > 0 && validatedHistory[0].role !== 'user') {
        validatedHistory.shift();
      }

      // Step 4: Ensure history ends with 'model' if we are about to send a 'user' message
      // Gemini's history in startChat should contain completed turns
      if (validatedHistory.length > 0 && validatedHistory[validatedHistory.length - 1].role !== 'model') {
        validatedHistory.pop();
      }

      console.log("Отправляю в ИИ (Payload):", {
        message: message,
        historyCount: validatedHistory.length,
        historyRoles: validatedHistory.map(h => h.role),
        fullHistory: JSON.stringify(validatedHistory, null, 2)
      });

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian. Answer concisely.",
      });

      const chat = model.startChat({
        history: validatedHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      // Return a clean error to the frontend as requested
      res.status(200).json({ 
        text: "Банкир занят. Попробуйте позже.", // User-friendly fallback message
        isError: true 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
