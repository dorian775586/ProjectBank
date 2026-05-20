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

      // Validating history to prevent Pattern Mismatch
      // Roles must alternate: user, model, user, model...
      // And must not have two identical roles in a row.
      const validatedHistory = (history || []).filter((item: any, index: number, self: any[]) => {
        if (index === 0) return item.role === 'user';
        return item.role !== self[index-1].role;
      });

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian.",
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
      // Return a clean error to the frontend
      const status = error.status || 500;
      const message = error.message || "AI Protocol Failure";
      res.status(status).json({ error: message });
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
