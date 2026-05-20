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
        return res.status(500).json({ error: "GEMINI_API_KEY is missing on server side" });
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest",
        systemInstruction: {
          role: "system",
          parts: [{ text: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian." }]
        }
      });

      const chat = model.startChat({
        history: history || [],
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();
      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to get response from AI" });
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
