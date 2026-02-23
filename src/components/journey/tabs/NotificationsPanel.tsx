'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface NotificationSettings {
  tripReminders: boolean;
  tripMemories: boolean;
  stepSuggestions: boolean;
  newLikes: boolean;
  newComments: boolean;
  newCommentLikes: boolean;
  travelTogether: boolean;
  importedEmails: boolean;
  newSteps: boolean;
  newFollowers: boolean;
  acceptedFollowRequests: boolean;
  friendSuggestions: boolean;
  travelBookStatus: boolean;
  travelBookPromotions: boolean;
  newFeatureAnnouncements: boolean;
}

const defaultSettings: NotificationSettings = {
  tripReminders: false,
  tripMemories: false,
  stepSuggestions: false,
  newLikes: false,
  newComments: false,
  newCommentLikes: false,
  travelTogether: false,
  importedEmails: false,
  newSteps: false,
  newFollowers: false,
  acceptedFollowRequests: false,
  friendSuggestions: false,
  travelBookStatus: false,
  travelBookPromotions: false,
  newFeatureAnnouncements: false,
};

const sections = [
  {
    title: 'My Trips',
    items: [
      { key: 'tripReminders', label: 'Trip reminders', description: 'Receive a reminder to create a trip when you start traveling.' },
      { key: 'tripMemories', label: 'Trip memories', description: 'Receive reminders from past adventures.' },
      { key: 'stepSuggestions', label: 'Step suggestions', description: 'Receive occasional suggestions to add steps during your trip.' },
      { key: 'newLikes', label: 'New likes', description: 'Receive a notification when someone likes your step.' },
      { key: 'newComments', label: 'New comments', description: 'Receive a notification when someone replies on your step or comment.' },
      { key: 'newCommentLikes', label: 'New comment likes', description: 'Receive a notification when someone likes your comment.' },
      { key: 'travelTogether', label: 'Travel Together', description: "Receive a notification when you're invited to a trip or a Travel Buddy accepts a trip invitation." },
      { key: 'importedEmails', label: 'Imported emails', description: 'Receive a notification when details from your forwarded emails are added to your trip.' },
    ],
  },
  {
    title: 'Friends',
    items: [
      { key: 'newSteps', label: 'New steps', description: 'Receive a notification when friends who are traveling now create new steps.' },
      { key: 'newFollowers', label: 'New followers', description: 'Receive a notification when someone requests to follow you (or starts following you if your profile is set to Public).' },
      { key: 'acceptedFollowRequests', label: 'Accepted follow requests', description: 'Receive a notification when a user accepts your request to follow them.' },
      { key: 'friendSuggestions', label: 'Friend suggestions', description: 'Receive a notification when a friend of yours joins TripNoute.' },
    ],
  },
  {
    title: 'My Travel Books',
    items: [
      { key: 'travelBookStatus', label: 'Travel Book status', description: 'Receive notifications about the status of your Travel Book.' },
      { key: 'travelBookPromotions', label: 'Travel Book promotions', description: 'Receive a notification when there is a Travel Book promotion.' },
    ],
  },
  {
    title: 'App',
    items: [
      { key: 'newFeatureAnnouncements', label: 'New feature announcements', description: 'Receive a notification when a major update in the app is introduced.' },
    ],
  },
];

interface NotificationsPanelProps {
  onBack: () => void;
}

export default function NotificationsPanel({ onBack }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.notificationSettings) {
            setSettings({ ...defaultSettings, ...data.notificationSettings });
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleToggle = (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, { notificationSettings: updated, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error('Failed to save notification settings:', err);
      }
    }, 800);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="flex items-center justify-center py-16"
      >
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-1 py-3 border-b border-white/10 mb-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
        <p className="text-white font-semibold text-sm flex-1">Notifications</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: sectionIndex * 0.05 }}
          >
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium mb-2 px-1">
              {section.title}
            </p>
            <div className="rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
              {section.items.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-start gap-3 px-4 py-3.5 bg-white/5"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm text-white font-medium leading-snug">{label}</p>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key as keyof NotificationSettings)}
                    className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 mt-0.5 ${
                      settings[key as keyof NotificationSettings]
                        ? 'bg-blue-500'
                        : 'bg-white/15'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ${
                        settings[key as keyof NotificationSettings]
                          ? 'left-[22px]'
                          : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
