'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, MapPin, Bell } from 'lucide-react';

interface SettingsMenuProps {
  userName?: string;
  onLogout: () => void;
}

const menuItems = [
  { icon: User, label: 'Profile' },
  { icon: Settings, label: 'Account' },
  { icon: MapPin, label: 'Saved Spots' },
  { icon: Bell, label: 'Notifications' },
];

export default function SettingsMenu({ userName, onLogout }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-black/20 hover:shadow-white/10 transition-shadow"
        aria-label="Settings"
      >
        <Settings className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-12 right-0 z-50 w-56 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Account</p>
              <p className="text-sm text-white font-semibold mt-0.5 truncate">
                {userName || 'Traveler'}
              </p>
            </div>

            <div className="py-1.5">
              {menuItems.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150 text-left"
                >
                  <Icon className="w-4 h-4 shrink-0 text-white/50" strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </div>

            <div className="py-1.5 border-t border-white/10">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 text-left"
              >
                <span className="w-4 h-4 shrink-0 flex items-center justify-center text-red-400/60">→</span>
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
