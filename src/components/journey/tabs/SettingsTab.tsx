'use client';

import { useState } from 'react';
import { User, Settings, MapPin, Bell, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ProfileEditPanel from './ProfileEditPanel';
import AccountEditPanel from './AccountEditPanel';

interface SettingsTabProps {
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
  onLogout: () => void;
}

const menuSections = [
  {
    title: 'Account',
    items: [
      { id: 'profile', icon: User, label: 'Profile', description: 'Edit your personal info' },
      { id: 'account', icon: Settings, label: 'Account', description: 'Manage your account settings' },
    ],
  },
  {
    title: 'App',
    items: [
      { id: 'spots', icon: MapPin, label: 'Saved Spots', description: 'View your saved locations' },
      { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Manage your notifications' },
    ],
  },
];

export default function SettingsTab({ userName, userEmail, userPhoto, onLogout }: SettingsTabProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  return (
    <div>
      <AnimatePresence mode="wait">
        {activePanel === 'profile' ? (
          <ProfileEditPanel key="profile" onBack={() => setActivePanel(null)} />
        ) : activePanel === 'account' ? (
          <AccountEditPanel key="account" onBack={() => setActivePanel(null)} />
        ) : (
          <motion.div
            key="main"
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="py-4 space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-4 px-2 py-3 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center">
                {userPhoto ? (
                  <Image src={userPhoto} alt={userName || 'User'} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-6 h-6 text-white/50" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-base truncate">{userName || 'Traveler'}</p>
                {userEmail && (
                  <p className="text-white/40 text-xs truncate mt-0.5">{userEmail}</p>
                )}
              </div>
            </motion.div>

            {menuSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * (sectionIndex + 1) }}
              >
                <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-2 px-1">
                  {section.title}
                </p>
                <div className="rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
                  {section.items.map(({ id, icon: Icon, label, description }) => (
                    <button
                      key={label}
                      onClick={() => setActivePanel(id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 transition-colors duration-150 text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-white/70" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0" strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              <div className="rounded-2xl overflow-hidden border border-red-500/20">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-500/5 hover:bg-red-500/10 transition-colors duration-150 text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-400" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-400 font-medium">Logout</p>
                    <p className="text-xs text-red-400/40 mt-0.5">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
