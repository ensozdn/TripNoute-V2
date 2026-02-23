'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ProfileEditPanelProps {
  onBack: () => void;
}

export default function ProfileEditPanel({ onBack }: ProfileEditPanelProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const parts = (user.displayName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhotoPreview(user.photoURL || null);

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCity(data.city || '');
          setBio(data.bio || '');
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.uid]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const displayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

      let photoURL: string | undefined;
      if (photoFile) {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const storage = getStorage();
        const storageRef = ref(storage, `users/${user!.uid}/avatar`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile({
        displayName: displayName || undefined,
        photoURL,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
      });

      if (photoURL) {
        setPhotoPreview(photoURL);
        setPhotoFile(null);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-3 px-1 py-3 border-b border-white/10 mb-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
        <p className="text-white font-semibold text-sm flex-1">Edit Profile</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500/30 transition-all"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Check className={`w-3.5 h-3.5 ${saved ? 'text-green-400' : 'text-blue-400'}`} />
          )}
          <span className={`text-xs font-medium ${saved ? 'text-green-400' : 'text-blue-400'}`}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </span>
        </button>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 hover:border-white/40 transition-all group"
          >
            {photoPreview ? (
              <Image src={photoPreview} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-white/40" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
          </button>
          <p className="text-xs text-white/40">Tap to change your picture</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest font-medium px-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest font-medium px-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-widest font-medium px-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Istanbul, Turkey"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-widest font-medium px-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world a little about yourself…"
            rows={3}
            maxLength={160}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all resize-none"
          />
          <p className="text-right text-xs text-white/20 pr-1">{bio.length}/160</p>
        </div>
      </div>
    </motion.div>
  );
}
