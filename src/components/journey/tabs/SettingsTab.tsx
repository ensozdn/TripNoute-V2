'use client';

import { useState, useEffect } from 'react';
import { User, Settings, MapPin, Bell, LogOut, ChevronRight, Shield, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ProfileEditPanel from './ProfileEditPanel';
import AccountEditPanel from './AccountEditPanel';
import SavedSpotsPanel from './SavedSpotsPanel';
import NotificationsPanel from './NotificationsPanel';
import { Place } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SettingsTabProps {
  userName?: string | null;
  userEmail?: string | null;
  userPhoto?: string | null;
  onLogout: () => void;
  places?: Place[];
}

type FollowPrivacy = 'anyone' | 'only_accepted';
type DistanceUnit = 'km' | 'miles';
type TemperatureUnit = 'celsius' | 'fahrenheit';

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

export default function SettingsTab({ userName, userEmail, userPhoto, onLogout, places = [] }: SettingsTabProps) {
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const [followPrivacy, setFollowPrivacy] = useState<FollowPrivacy>('only_accepted');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');
  const [showUnitsMenu, setShowUnitsMenu] = useState(false);
  const [showTempMenu, setShowTempMenu] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.privacySettings?.followPrivacy) setFollowPrivacy(data.privacySettings.followPrivacy);
          if (data.appSettings?.distanceUnit) setDistanceUnit(data.appSettings.distanceUnit);
          if (data.appSettings?.temperatureUnit) setTemperatureUnit(data.appSettings.temperatureUnit);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    load();
  }, [user?.uid]);

  const savePrivacy = async (value: FollowPrivacy) => {
    setFollowPrivacy(value);
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { privacySettings: { followPrivacy: value }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save privacy:', err);
    }
  };

  const saveDistanceUnit = async (value: DistanceUnit) => {
    setDistanceUnit(value);
    setShowUnitsMenu(false);
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { appSettings: { distanceUnit: value, temperatureUnit }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save distance unit:', err);
    }
  };

  const saveTempUnit = async (value: TemperatureUnit) => {
    setTemperatureUnit(value);
    setShowTempMenu(false);
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { appSettings: { distanceUnit, temperatureUnit: value }, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Failed to save temperature unit:', err);
    }
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {activePanel === 'profile' ? (
          <ProfileEditPanel key="profile" onBack={() => setActivePanel(null)} />
        ) : activePanel === 'account' ? (
          <AccountEditPanel key="account" onBack={() => setActivePanel(null)} />
        ) : activePanel === 'spots' ? (
          <SavedSpotsPanel key="spots" onBack={() => setActivePanel(null)} places={places} />
        ) : activePanel === 'notifications' ? (
          <NotificationsPanel key="notifications" onBack={() => setActivePanel(null)} />
        ) : (
          <motion.div
            key="main"
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="py-4 space-y-6"
          >
            {/* User card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-4 px-2 py-3 rounded-2xl bg-black/4 border border-black/8"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-black/8 border border-black/10 shrink-0 flex items-center justify-center">
                {userPhoto ? (
                  <Image src={userPhoto} alt={userName || 'User'} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 font-semibold text-base truncate">{userName || 'Traveler'}</p>
                {userEmail && (
                  <p className="text-slate-400 text-xs truncate mt-0.5">{userEmail}</p>
                )}
              </div>
            </motion.div>

            {/* Account + App sections */}
            {menuSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * (sectionIndex + 1) }}
              >
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-2 px-1">
                  {section.title}
                </p>
                <div className="rounded-2xl overflow-hidden border border-black/8 divide-y divide-black/5">
                  {section.items.map(({ id, icon: Icon, label, description }) => (
                    <button
                      key={label}
                      onClick={() => setActivePanel(id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-black/3 hover:bg-black/6 transition-colors duration-150 text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-black/6 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Privacy section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <Shield className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Privacy</p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-black/8 divide-y divide-black/5">
                {/* Who can follow me */}
                <div className="px-4 py-3.5 bg-black/3 space-y-3">
                  <p className="text-sm text-slate-800 font-medium">Who can follow me</p>
                  <div className="space-y-2">
                    {([
                      { value: 'anyone', label: 'Anyone' },
                      { value: 'only_accepted', label: 'Only people I accept' },
                    ] as { value: FollowPrivacy; label: string }[]).map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => savePrivacy(value)}
                        className="w-full flex items-center justify-between py-1.5 group"
                      >
                        <span className={`text-sm transition-colors ${followPrivacy === value ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
                          {label}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          followPrivacy === value
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {followPrivacy === value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-white"
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Who can see my trips */}
                <div className="px-4 py-3.5 bg-black/3">
                  <p className="text-sm text-slate-800 font-medium">Who can see my trips</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    You can manage the privacy level of your individual trips in the trip settings.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* App Settings section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">App Settings</p>
              </div>
              <div className="rounded-2xl overflow-hidden border border-black/8 divide-y divide-black/5">
                {/* Units */}
                <div className="relative">
                  <button
                    onClick={() => { setShowUnitsMenu(!showUnitsMenu); setShowTempMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-black/3 hover:bg-black/6 transition-colors"
                  >
                    <p className="text-sm text-slate-800 font-medium">Units</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-blue-500">{distanceUnit === 'km' ? 'Kilometres' : 'Miles'}</span>
                      <ChevronRight className={`w-4 h-4 text-blue-400 transition-transform ${showUnitsMenu ? 'rotate-90' : ''}`} strokeWidth={1.8} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {showUnitsMenu && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-black/5"
                      >
                        {(['km', 'miles'] as DistanceUnit[]).map((u) => (
                          <button
                            key={u}
                            onClick={() => saveDistanceUnit(u)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-black/2 hover:bg-black/5 transition-colors"
                          >
                            <span className={`text-sm ${distanceUnit === u ? 'text-blue-500' : 'text-slate-500'}`}>
                              {u === 'km' ? 'Kilometres' : 'Miles'}
                            </span>
                            {distanceUnit === u && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Temperature */}
                <div className="relative">
                  <button
                    onClick={() => { setShowTempMenu(!showTempMenu); setShowUnitsMenu(false); }}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-black/3 hover:bg-black/6 transition-colors"
                  >
                    <p className="text-sm text-slate-800 font-medium">Temperature</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-blue-500">{temperatureUnit === 'celsius' ? 'Celsius' : 'Fahrenheit'}</span>
                      <ChevronRight className={`w-4 h-4 text-blue-400 transition-transform ${showTempMenu ? 'rotate-90' : ''}`} strokeWidth={1.8} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {showTempMenu && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-black/5"
                      >
                        {(['celsius', 'fahrenheit'] as TemperatureUnit[]).map((u) => (
                          <button
                            key={u}
                            onClick={() => saveTempUnit(u)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-black/2 hover:bg-black/5 transition-colors"
                          >
                            <span className={`text-sm ${temperatureUnit === u ? 'text-blue-500' : 'text-slate-500'}`}>
                              {u === 'celsius' ? 'Celsius' : 'Fahrenheit'}
                            </span>
                            {temperatureUnit === u && (
                              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Logout */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25 }}
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
