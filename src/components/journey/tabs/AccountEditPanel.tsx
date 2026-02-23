'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AccountEditPanelProps {
  onBack: () => void;
}

type SectionState = 'idle' | 'saving' | 'saved' | 'error';

export default function AccountEditPanel({ onBack }: AccountEditPanelProps) {
  const { user, updateEmail, updateSecondaryEmail, updatePassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailState, setEmailState] = useState<SectionState>('idle');
  const [emailError, setEmailError] = useState('');

  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [secondaryState, setSecondaryState] = useState<SectionState>('idle');
  const [secondaryError, setSecondaryError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordForPw, setCurrentPasswordForPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [passwordState, setPasswordState] = useState<SectionState>('idle');
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccount = async () => {
      if (!user) return;
      setEmail(user.email || '');
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSecondaryEmail(data.secondaryEmail || '');
        }
      } finally {
        setLoading(false);
      }
    };
    loadAccount();
  }, [user]);

  const handleEmailSave = async () => {
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Email cannot be empty.');
      return;
    }
    if (!emailPassword) {
      setEmailError('Please enter your current password to confirm.');
      return;
    }
    setEmailState('saving');
    try {
      await updateEmail(email.trim(), emailPassword);
      setEmailPassword('');
      setEmailState('saved');
      setTimeout(() => setEmailState('idle'), 2500);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to update email.');
      setEmailState('error');
      setTimeout(() => setEmailState('idle'), 3000);
    }
  };

  const handleSecondaryEmailSave = async () => {
    setSecondaryError('');
    setSecondaryState('saving');
    try {
      await updateSecondaryEmail(secondaryEmail.trim());
      setSecondaryState('saved');
      setTimeout(() => setSecondaryState('idle'), 2500);
    } catch (err: unknown) {
      setSecondaryError(err instanceof Error ? err.message : 'Failed to update secondary email.');
      setSecondaryState('error');
      setTimeout(() => setSecondaryState('idle'), 3000);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError('');
    if (!currentPasswordForPw) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordState('saving');
    try {
      await updatePassword(currentPasswordForPw, newPassword);
      setCurrentPasswordForPw('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordState('saved');
      setTimeout(() => setPasswordState('idle'), 2500);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password.');
      setPasswordState('error');
      setTimeout(() => setPasswordState('idle'), 3000);
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
      <div className="flex items-center gap-3 px-1 py-3 border-b border-white/10 mb-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" strokeWidth={2} />
        </button>
        <p className="text-white font-semibold text-sm flex-1">Account Settings</p>
      </div>

      <div className="space-y-6">
        {/* Email */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Mail className="w-3.5 h-3.5 text-white/30" strokeWidth={2} />
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Email</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Required to change email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            {emailError && (
              <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" strokeWidth={2} />
                <p className="text-xs text-red-400">{emailError}</p>
              </div>
            )}
            <SaveButton state={emailState} onSave={handleEmailSave} />
          </div>
        </div>

        {/* Secondary Email */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Mail className="w-3.5 h-3.5 text-white/30" strokeWidth={2} />
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Secondary Email</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">Secondary Email Address</label>
              <input
                type="email"
                value={secondaryEmail}
                onChange={(e) => setSecondaryEmail(e.target.value)}
                placeholder="backup@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
            {secondaryError && (
              <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" strokeWidth={2} />
                <p className="text-xs text-red-400">{secondaryError}</p>
              </div>
            )}
            <SaveButton state={secondaryState} onSave={handleSecondaryEmailSave} />
          </div>
        </div>

        {/* Change Password */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lock className="w-3.5 h-3.5 text-white/30" strokeWidth={2} />
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Change Password</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPasswordForPw}
                  onChange={(e) => setCurrentPasswordForPw(e.target.value)}
                  placeholder="Your current password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 px-1">New Password Again</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:outline-none transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500/40 focus:border-red-500/60'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-green-500/40 focus:border-green-500/60'
                      : 'border-white/10 focus:border-white/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
                </button>
              </div>
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-xs text-green-400/70 px-1 flex items-center gap-1">
                  <Check className="w-3 h-3" strokeWidth={2.5} /> Passwords match
                </p>
              )}
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 px-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" strokeWidth={2} />
                <p className="text-xs text-red-400">{passwordError}</p>
              </div>
            )}
            <SaveButton state={passwordState} onSave={handlePasswordSave} label="Update Password" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface SaveButtonProps {
  state: SectionState;
  onSave: () => void;
  label?: string;
}

function SaveButton({ state, onSave, label = 'Save Changes' }: SaveButtonProps) {
  return (
    <button
      onClick={onSave}
      disabled={state === 'saving'}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:cursor-not-allowed ${
        state === 'saved'
          ? 'bg-green-500/20 border border-green-500/30 text-green-400'
          : state === 'error'
          ? 'bg-red-500/20 border border-red-500/30 text-red-400'
          : 'bg-white/10 border border-white/15 text-white hover:bg-white/15'
      }`}
    >
      {state === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === 'saved' && <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
      <span>
        {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved!' : state === 'error' ? 'Failed' : label}
      </span>
    </button>
  );
}
