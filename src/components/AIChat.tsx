import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AIChatProps {
  t: (key: any) => string;
}

export const AIChat: React.FC<AIChatProps> = ({ t }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('ai_welcome'),
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          history: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to connect to AI server');
      }
      
      const data = await response.json();
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || 'Банкир промолчал.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Ошибка: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-chat-container" className="flex flex-col h-[calc(100vh-160px)]">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 relative shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-green text-black rounded-tr-none' 
                    : 'bg-[#1a1a1a] text-white/90 border border-white/5 rounded-tl-none'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className={`text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-black/50' : 'text-white/30'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[#1a1a1a] rounded-2xl px-4 py-3 border border-white/5 rounded-tl-none">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center space-x-2 bg-[#111] rounded-2xl px-4 py-1 border border-white/5">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('type_message')}
            className="flex-1 bg-transparent border-none focus:outline-none text-white text-sm py-3"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${
              input.trim() && !isLoading 
                ? 'bg-emerald-green text-black scale-100' 
                : 'bg-white/5 text-white/20 scale-90'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
