import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Critical: GEMINI_API_KEY is missing");
        return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
      }

      // Strict Validation and Sanitization of History
      let validatedContents: any[] = [];
      const rawHistory = history || [];

      // Add history to contents
      if (rawHistory.length > 0) {
        const cleaned = rawHistory.filter((m: any) => 
          m.role && m.parts && m.parts[0] && m.parts[0].text && m.parts[0].text.trim() !== ""
        );

        for (const msg of cleaned) {
          if (validatedContents.length > 0 && validatedContents[validatedContents.length - 1].role === msg.role) {
            validatedContents[validatedContents.length - 1].parts[0].text += "\n" + msg.parts[0].text;
          } else {
            validatedContents.push({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.parts[0].text }]
            });
          }
        }
      }

      // Ensure alternating sequence and starts with user
      if (validatedContents.length > 0 && validatedContents[0].role !== 'user') validatedContents.shift();
      
      // Add current message
      validatedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      console.log("Отправляю в ИИ (Direct Fetch):", JSON.stringify({ contents: validatedContents }, null, 2));

      // Direct FETCH to Google API to ensure NO client headers are passed
      const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NO EXTRA HEADERS (like X-Forwarded-For) passed here
        },
        body: JSON.stringify({
          contents: validatedContents,
          systemInstruction: {
            parts: [{ text: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian. Answer concisely." }]
          }
        })
      });

      console.log("Response Status from Google:", googleResponse.status);

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text();
        console.error(`Google API Error (${googleResponse.status}):`, errorText);
        return res.json({ 
          text: "Банкир занят. Попробуйте позже.", 
          isError: true,
          debugStatus: googleResponse.status 
        });
      }

      const data = await googleResponse.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Банкир молчит.";
      
      res.json({ text });
    } catch (error: any) {
      console.error("Server Proxy Critical Failure:", error);
      res.json({ text: "Банкир занят. Попробуйте позже.", isError: true });
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
