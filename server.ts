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

      // --- КРИТИЧЕСКАЯ ПРОВЕРКА ОБНОВЛЕНИЯ КОДА ---
      if (message && message.toString().toUpperCase().trim() === "ТЕСТ") {
        return res.json({ text: "СЕРВЕР ОБНОВЛЕН, ВИЖУ ТЕБЯ" });
      }
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Critical: GEMINI_API_KEY is missing");
        return res.json({ text: "Серверная ошибка: Отсутствует API ключ (GEMINI_API_KEY).", isError: true });
      }

      // --- СТРОГАЯ ВАЛИДАЦИЯ ИСТОРИИ (PATTERN MISMATCH FIX) ---
      let validatedContents: any[] = [];
      const rawHistory = history || [];

      // 1. Очистка от пустых сообщений и нормализация
      const cleaned = rawHistory.filter((m: any) => 
        m.role && m.parts && m.parts[0] && m.parts[0].text && m.parts[0].text.trim() !== ""
      ).map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.parts[0].text.trim() }]
      }));

      // 2. Обеспечение чередования (user -> model -> user)
      // Если две одинаковые роли подряд - оставляем последнюю
      for (const msg of cleaned) {
        if (validatedContents.length > 0 && validatedContents[validatedContents.length - 1].role === msg.role) {
          validatedContents[validatedContents.length - 1] = msg; // Заменяем на более свежее
        } else {
          validatedContents.push(msg);
        }
      }

      // 3. Должно начинаться с user
      if (validatedContents.length > 0 && validatedContents[0].role !== 'user') {
        validatedContents.shift();
      }

      // 4. Добавляем текущее сообщение (всегда user)
      if (validatedContents.length > 0 && validatedContents[validatedContents.length - 1].role === 'user') {
        // Если последнее в истории тоже user (что странно для Gemini), заменяем его или просто добавляем?
        // Обычно Gemini ожидает history заканчивающуюся на model перед новым user сообщением.
        // Но sendMessage/generateContent берет массив contents целиком.
        // Если мы отправляем generateContent, последний элемент ДОЛЖЕН быть user.
      }

      validatedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // 5. Финальная проверка: если вдруг после сдвигов/удалений массив пуст или не с того начался
      // (Проверка выше уже покрыла это, но для надежности)

      console.log("FINAL HISTORY SENT TO GOOGLE:", JSON.stringify(validatedContents, null, 2));

      const payload = {
        contents: validatedContents,
        systemInstruction: {
          parts: [{ text: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian. Answer concisely." }]
        }
      };

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
