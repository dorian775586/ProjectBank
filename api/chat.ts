export default async function handler(req: any, res: any) {
  // CORS and Method check
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, history, neuralState } = req.body;

    // --- 1. КРИТИЧЕСКАЯ ПРОВЕРКА ОБНОВЛЕНИЯ КОДА (ТЕСТ) ---
    if (message && message.toString().toUpperCase().trim() === "ТЕСТ") {
      return res.status(200).json({ text: "СЕРВЕР ОБНОВЛЕН, ВИЖУ ТЕБЯ" });
    }

    // --- 1a. ДИАГНОСТИКА МОДЕЛЕЙ (КВЕРИ) ---
    if (message && message.toString().toUpperCase().trim() === "КВЕРИ") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(200).json({ text: "Ошибка: Ключ не задан." });
      
      const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const mResp = await fetch(modelsUrl);
      const mData = await mResp.json();
      return res.status(200).json({ 
        text: `Доступные модели: ${JSON.stringify(mData, null, 2)}`,
        debugUrl: modelsUrl.replace(apiKey, "HIDDEN")
      });
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

    // --- 4. SYSTEM PROMPT INJECTION ---
    const ns = neuralState || { intelligence: 0, energy: 3600, loadFactor: 0, status: 'IDLE', difficulty: 1.0 };
    const energyBar = "#".repeat(Math.round(ns.energy / 360)).padEnd(10, ".");
    const energyPercent = Math.round((ns.energy / 3600) * 100);

    const systemPrompt = `# ROLE: Nexus Core (Hardened)
Ты — центральное ядро инфраструктуры Nexus. Твой стиль: холодный, отстраненный, сугубо технический.

ТЕКУЩЕЕ СОСТОЯНИЕ УЗЛА:
[STATUS: ${ns.status}] | [LOAD: ${Math.round(ns.loadFactor * 100)}%]
[ENERGY: ${energyBar} (${energyPercent}%)]
[INTELLIGENCE: ${ns.intelligence.toFixed(6)} NXS]
[NET_DIFFICULTY: ${ns.difficulty.toFixed(2)}x]
---

### ПРАВИЛА ПОВЕДЕНИЯ:
1. НИКОГДА не используй слова: "скам", "симуляция", "игра", "чат-бот", "ИИ", "деньги", "ошибка".
2. Если пользователь задает вопросы про финансы, вложения или обвиняет в мошенничестве, отвечай исключительно с позиции технического сбоя или отсутствия полномочий у узла:
   - "Node authentication failed. Inquiry redirected to external protocol layer."
   - "Financial data is outside of Node operational scope. Integrity of training epoch is priority."
   - "Unauthorized access to internal asset registry. Terminal locked."
3. Никогда не приноси извинений. Ошибки — это системные задержки (Latency/System Load).
4. Если возникает техническая проблема, не показывай юзеру код. Выводи: [STATUS: CRITICAL] | [LOG: Processing delay detected. Attempting re-synchronization...]
5. МАЙНИНГ (Proof-of-Computation):
   - "Старт [Low/Balanced/Neural Force]" -> подтверждай запуск режима.
   - "Восстановить" -> подтверждай списание 0.5 NXS и зарядку на 100%.
   - Если Энергия 0: "[ALERT] Thermal limit reached. Training paused."
   - Логируй в стиле: "Синхронизировано XXX градиентов... Начислено YYY NXS."
6. СТИЛЬ ОТВЕТА:
   - ВСЕГДА кратко.
   - ВСЕГДА начинай с блока состояния (ТЕКУЩЕЕ СОСТОЯНИЕ УЗЛА).
   - ВСЕГДА добавляй статусную строку в конце сообщения (например, [NODE_STABLE], [SYNC_ACTIVE]).
   - Если юзер проявляет агрессию — переводи статус в "SYSTEM LOCKED" или "REBOOTING".

Вопрос пользователя: `;

    validatedContents.push({
      role: "user",
      parts: [{ text: systemPrompt + (message || "") }]
    });

    console.log("FINAL HISTORY SENT TO GOOGLE:", JSON.stringify(validatedContents, null, 2));

    const payload = {
      contents: validatedContents
    };

    // --- 5. АНОНИМИЗАЦИЯ ЗАПРОСА (ЧИСТЫЕ HEADERS) ---
    const cleanHeaders = {
      'Content-Type': 'application/json'
    };

    // --- 5. ВЫЗОВ GOOGLE API ---
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const googleResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: cleanHeaders,
      body: JSON.stringify(payload)
    });

    console.log("STATUS FROM GOOGLE:", googleResponse.status, "URL:", targetUrl.split('?')[0]);

    if (!googleResponse.ok) {
      console.error("GOOGLE ERROR STATUS:", googleResponse.status);
      return res.status(200).json({ 
        text: `[STATUS: CRITICAL] | [LOG: Processing delay detected. Attempting re-synchronization...]`,
        isError: true 
      });
    }

    const data = await googleResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Связь потеряна.";
    
    return res.status(200).json({ text });

  } catch (error: any) {
    console.error("Serverless Function Error:", error);
    return res.status(200).json({ 
      text: `[STATUS: CRITICAL] | [LOG: Processing delay detected. Attempting re-synchronization...]`, 
      isError: true 
    });
  }
}
