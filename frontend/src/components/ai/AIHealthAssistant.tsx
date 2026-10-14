import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, AlertTriangle, Globe } from 'lucide-react';
import apiClient from '@/api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: string;
}

export const AIHealthAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text:
        'Hello! I am your Smart Health Camp Assistant. I can help explain camp schedules, free checkups, registration steps, and general health awareness topics.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'system',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'kn' : 'en';
    setLanguage(nextLang);
    const greeting =
      nextLang === 'kn'
        ? 'ನಮಸ್ಕಾರ! ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ಆರೋಗ್ಯ ಶಿಬಿರದ ವಿವರಗಳು ಅಥವಾ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'
        : 'Language switched to English. How can I assist you with your health camp visit today?';

    setMessages((prev) => [
      ...prev,
      {
        id: `lang-${Date.now()}`,
        sender: 'bot',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', {
        message: query,
        language,
      });

      const replyText = res.data?.data?.response || 'I am here to assist with health camp information.';
      const source = res.data?.data?.source;

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `b-err-${Date.now()}`,
        sender: 'bot',
        text:
          language === 'kn'
            ? 'ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನೇರವಾಗಿ ನಮ್ಮ ಶಿಬಿರದ ಹೆಲ್ಪ್‌ಲೈನ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ.'
            : 'Sorry, I am temporarily unable to connect to the knowledge server. Please consult our camp volunteers or call helpline.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Health Assistant"
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/30 border border-cyan-300/40 relative group"
      >
        <Bot className="w-7 h-7 text-slate-900 group-hover:rotate-6 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-96 max-w-sm h-[520px] rounded-3xl bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    Health Assistant <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-normal">AI Info</span>
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Bilingual Support Active
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-cyan-300 transition-colors flex items-center gap-1"
                  title="Switch English / Kannada"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {language === 'en' ? 'KN' : 'EN'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed text-sm ${
                      m.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 rounded-br-none font-medium'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 px-3 py-2 rounded-xl w-fit">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto text-[11px] border-t border-slate-800/80 scrollbar-none">
              {[
                'Services offered?',
                'How to book?',
                'What to bring?',
                'Emergency contact',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputMessage(suggestion);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors border border-slate-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={language === 'kn' ? 'ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ...' : 'Ask about camps, appointments...'}
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Safety Disclaimer Footer */}
            <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 text-center">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Informational only. Not medical prescription. In emergency call 108.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIHealthAssistant;

