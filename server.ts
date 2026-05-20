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
      const { message } = req.body;

      // --- КРИТИЧЕСКАЯ ПРОВЕРКА ОБНОВЛЕНИЯ КОДА ---
      if (message && message.toString().toUpperCase().trim() === "ТЕСТ") {
        return res.json({ text: "СЕРВЕР ОБНОВЛЕН, ВИЖУ ТЕБЯ" });
      }
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Critical: GEMINI_API_KEY is missing");
        return res.json({ text: "Серверная ошибка: Отсутствует API ключ (GEMINI_API_KEY).", isError: true });
      }

      // Simplified payload (No history for diagnosis)
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: message }]
        }],
        systemInstruction: {
          parts: [{ text: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian. Answer concisely." }]
        }
      };

      console.log("Payload sent to Google:", JSON.stringify(payload));

      // 1. ABSOLUTE ANONYMIZATION: Create clean headers manually
      const cleanHeaders = {
        'Content-Type': 'application/json'
      };

      // 2. Direct FETCH to Google API using URL API Key
      const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: cleanHeaders,
        body: JSON.stringify(payload)
      });

      console.log("STATUS FROM GOOGLE:", googleResponse.status);

      if (!googleResponse.ok) {
        const errorData = await googleResponse.text();
        console.error("GOOGLE ERROR BODY:", errorData);
        // Return full error for debugging in the UI
        return res.json({ 
          text: `Ошибка Google: ${googleResponse.status} ${errorData}`, 
          isError: true 
        });
      }

      const data = await googleResponse.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Банкир молчит.";
      
      res.json({ text });
    } catch (error: any) {
      console.error("Server Proxy Critical Failure:", error);
      res.json({ text: `Критическая ошибка сервера: ${error.message}`, isError: true });
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
