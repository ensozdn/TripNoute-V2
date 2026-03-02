'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, ChevronDown } from 'lucide-react';
import { useTrippo } from '@/hooks/useTrippo';

interface Message {
  role: 'user' | 'trippo';
  text: string;
}

interface TrippoChatProps {
  context?: string; // örn. aktif journey adı
}

export default function TrippoChat({ context }: TrippoChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'trippo',
      text: '✈️ Merhaba! Ben Trippo. Seyahat planın hakkında her şeyi sorabilirsin!',
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { chat, loading } = useTrippo();

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);

    const result = await chat(text, context);
    if (result) {
      setMessages((prev) => [...prev, { role: 'trippo', text: result.text }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: 'trippo', text: '😅 Şu an biraz meşgulüm, tekrar dener misin?' },
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trippo-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed top-14 right-4 z-[150] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            aria-label="Trippo AI Asistan"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="trippo-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[210] bg-black/30 backdrop-blur-[2px]"
            />

            {/* Sheet */}
            <motion.div
              key="trippo-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-[211] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '75vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/6 shrink-0"
                style={{ background: 'linear-gradient(to right, #eff6ff, #eef2ff)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                  >
                    <Sparkles className="w-4.5 h-4.5 text-white w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm leading-none">Trippo</p>
                    <p className="text-xs text-slate-400 mt-0.5">AI Seyahat Asistanın</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/6 flex items-center justify-center"
                >
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}

                {/* Loading dots */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-8 pt-3 border-t border-black/6 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-black/8 px-4 pr-2 py-2 focus-within:border-blue-400 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Trippo'ya sor…"
                    className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-300 text-sm outline-none py-1"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
