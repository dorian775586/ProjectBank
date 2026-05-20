export default async function handler(req: any, res: any) {
  // CORS and Method check
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, history } = req.body;

    // --- 1. КРИТИЧЕСКАЯ ПРОВЕРКА ОБНОВЛЕНИЯ КОДА (ТЕСТ) ---
    if (message && message.toString().toUpperCase().trim() === "ТЕСТ") {
      return res.status(200).json({ text: "СЕРВЕР ОБНОВЛЕН, ВИЖУ ТЕБЯ" });
    }

    // --- 2. API КЛЮЧ ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Critical: GEMINI_API_KEY is missing in Vercel environment");
      return res.status(200).json({ 
        text: "Ошибка: Ключ GEMINI_API_KEY не задан в настройках Vercel.", 
        isError: true 
      });
    }

    // --- 3. ИСПРАВЛЕНИЕ PATTERN MISMATCH (ВАЛИДАЦИЯ ИСТОРИИ) ---
    let validatedContents: any[] = [];
    const rawHistory = history || [];

    // Очистка и нормализация
    const cleaned = rawHistory.filter((m: any) => 
      m.role && m.parts && m.parts[0] && m.parts[0].text && m.parts[0].text.trim() !== ""
    ).map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.parts[0].text.trim() }]
    }));

    // Обеспечение чередования и объединение одинаковых ролей подряд
    for (const msg of cleaned) {
      if (validatedContents.length > 0 && validatedContents[validatedContents.length - 1].role === msg.role) {
        // Если роли совпадают, объединяем текст через перевод строки
        validatedContents[validatedContents.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      } else {
        validatedContents.push(msg);
      }
    }

    // История ОБЯЗАНА начинаться с user. Если первым идет model — удаляем.
    if (validatedContents.length > 0 && validatedContents[0].role !== 'user') {
      validatedContents.shift();
    }

    // Если после удаления всё еще не user (или пусто), и мы хотим добавить текущий user месседж:
    // Мы просто добавляем текущее сообщение. Gemini ожидает [user, model, user, model, ..., user]
    validatedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    console.log("FINAL HISTORY SENT TO GOOGLE:", JSON.stringify(validatedContents, null, 2));

    const payload = {
      contents: validatedContents,
      systemInstruction: {
        parts: [{ text: "You are the ProjectBank Assistant. You help users with crypto, credit, and project info. Default language: Russian. Answer concisely." }]
      }
    };

    // --- 4. АНОНИМИЗАЦИЯ ЗАПРОСА (ЧИСТЫЕ HEADERS) ---
    const cleanHeaders = {
      'Content-Type': 'application/json'
    };

    // --- 5. ВЫЗОВ GOOGLE API ---
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: cleanHeaders,
      body: JSON.stringify(payload)
    });

    console.log("STATUS FROM GOOGLE:", googleResponse.status);

    if (!googleResponse.ok) {
      const errorData = await googleResponse.text();
      console.error("GOOGLE ERROR BODY:", errorData);
      return res.status(200).json({ 
        text: `Ошибка Google API (Код: ${googleResponse.status}): ${errorData}`, 
        isError: true 
      });
    }

    const data = await googleResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Банкир молчит.";
    
    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Serverless Function Error:", error);
    return res.status(200).json({ 
      text: `Критическая ошибка кода: ${error.message}`, 
      isError: true 
    });
  }
}
