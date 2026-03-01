'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, registerSchema } from '@/utils/validators';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

type View = 'splash' | 'login' | 'register';

// ── Google SVG ────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Animated Plane ────────────────────────────────────────────────────────────
function AnimatedPlane() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-blue-400/20"
        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-20 h-20 rounded-full border border-blue-400/20"
        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
      />
      <motion.div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40"
        style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
        animate={{ rotate: [0, -3, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.svg
          width="32" height="32" viewBox="0 0 24 24" fill="none"
          animate={{ y: [0, -2, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="white"/>
        </motion.svg>
      </motion.div>
    </div>
  );
}

// ── Floating dots ─────────────────────────────────────────────────────────────
function FloatingDot({ style, delay }: { style: React.CSSProperties; delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-blue-400/40"
      style={style}
      animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// ── Shared background ─────────────────────────────────────────────────────────
function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #3b82f6 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #2563eb 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <FloatingDot style={{ top: '15%', left: '12%' }} delay={0} />
      <FloatingDot style={{ top: '25%', left: '80%' }} delay={0.8} />
      <FloatingDot style={{ top: '60%', left: '8%' }} delay={1.5} />
      <FloatingDot style={{ top: '70%', left: '88%' }} delay={0.4} />
      <FloatingDot style={{ top: '40%', left: '92%' }} delay={2} />
      <FloatingDot style={{ top: '80%', left: '20%' }} delay={1.2} />
    </div>
  );
}

// ── Splash View ───────────────────────────────────────────────────────────────
function SplashView({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <AnimatedPlane />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3"
      >
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-white">Trip</span>
          <span style={{ color: '#60a5fa' }}>Noute</span>
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="text-slate-400 text-base mb-1 max-w-xs"
      >
        Your world, your story.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-slate-500 text-sm leading-relaxed mb-12 max-w-xs"
      >
        Document every adventure on your personal travel map.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xs flex flex-col gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onRegister}
          className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-xl shadow-blue-500/30"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
        >
          Get Started
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onLogin}
          className="w-full py-4 rounded-2xl font-semibold text-base border transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          Sign In
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Login View ────────────────────────────────────────────────────────────────
function LoginView({ onBack, onGoRegister }: { onBack: () => void; onGoRegister: () => void }) {
  const router = useRouter();
  const { login, loginWithGoogle, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    const v = loginSchema.safeParse({ email, password });
    if (!v.success) { setValidationError(v.error.issues[0].message); return; }
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch { /* error shown via context */ }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    clearError();
    setValidationError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch { /* error shown via context */ }
    finally { setLoading(false); }
  };

  const displayError = validationError || error;

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col px-6 pt-14 pb-8 overflow-y-auto"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mb-8 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-1">Welcome back</h2>
        <p className="text-slate-400 text-sm">Sign in to continue your journey</p>
      </div>

      {/* Error */}
      {displayError && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm text-red-400 border border-red-500/30"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
          {displayError}
        </div>
      )}

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm mb-5 transition-all active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}
      >
        <GoogleIcon />
        {loading ? 'Please wait…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <span className="text-slate-500 text-xs font-medium">or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all border"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', caretColor: '#60a5fa' }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-3.5 pr-12 rounded-2xl text-white text-sm outline-none transition-all border"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', caretColor: '#60a5fa' }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-xl shadow-blue-500/25 mt-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </motion.button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <button onClick={onGoRegister} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
          Create one
        </button>
      </p>
    </motion.div>
  );
}

// ── Register View ─────────────────────────────────────────────────────────────
function RegisterView({ onBack, onGoLogin }: { onBack: () => void; onGoLogin: () => void }) {
  const router = useRouter();
  const { register, loginWithGoogle, error, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    if (!agreeToTerms) { setValidationError('Please agree to the Terms of Service'); return; }
    const v = registerSchema.safeParse({ email, password, displayName, confirmPassword });
    if (!v.success) { setValidationError(v.error.issues[0].message); return; }
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.push('/dashboard');
    } catch { /* error shown via context */ }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    clearError();
    setValidationError('');
    if (!agreeToTerms) { setValidationError('Please agree to the Terms of Service'); return; }
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch { /* error shown via context */ }
    finally { setLoading(false); }
  };

  const displayError = validationError || error;

  const inputClass = "w-full px-4 py-3.5 rounded-2xl text-white text-sm outline-none transition-all border";
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', caretColor: '#60a5fa' };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col px-6 pt-14 pb-8 overflow-y-auto"
    >
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mb-8 w-fit">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-1">Create account</h2>
        <p className="text-slate-400 text-sm">Start your travel journey today</p>
      </div>

      {/* Error */}
      {displayError && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm text-red-400 border border-red-500/30"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
          {displayError}
        </div>
      )}

      {/* Google */}
      <button onClick={handleGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm mb-5 transition-all active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
        <GoogleIcon />
        {loading ? 'Please wait…' : 'Sign up with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <span className="text-slate-500 text-xs font-medium">or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
          <input type="text" placeholder="John Doe" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={loading} required
              className={`${inputClass} pr-12`} style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
          <input type="password" placeholder="••••••••" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreeToTerms(v => !v)}
            className="w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{
              backgroundColor: agreeToTerms ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              borderColor: agreeToTerms ? '#3b82f6' : 'rgba(255,255,255,0.15)',
            }}
          >
            {agreeToTerms && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-slate-400 text-xs leading-relaxed">
            I agree to the{' '}
            <span className="text-blue-400">Terms of Service</span>
            {' '}and{' '}
            <span className="text-blue-400">Privacy Policy</span>
          </span>
        </label>

        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-xl shadow-blue-500/25 mt-1 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        Already have an account?{' '}
        <button onClick={onGoLogin} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
          Sign in
        </button>
      </p>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [view, setView] = useState<View>('splash');

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0c1a3a 50%, #0f172a 100%)' }}
    >
      <Background />

      {/* Flight path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <motion.path
          d="M -20 600 Q 100 400 200 350 Q 300 300 410 200"
          fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="8 6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
        />
      </svg>

      {/* Views */}
      <div className="relative z-10 flex-1 flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'splash' && (
          <SplashView
            key="splash"
            onLogin={() => setView('login')}
            onRegister={() => setView('register')}
          />
        )}
        {view === 'login' && (
          <LoginView
            key="login"
            onBack={() => setView('splash')}
            onGoRegister={() => setView('register')}
          />
        )}
        {view === 'register' && (
          <RegisterView
            key="register"
            onBack={() => setView('splash')}
            onGoLogin={() => setView('login')}
          />
        )}
      </AnimatePresence>
      </div>

      {/* Footer */}
      {view === 'splash' && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative z-10 pb-8 text-center"
        >
          <p className="text-slate-600 text-xs">© 2026 TripNoute · Built for travelers</p>
        </motion.div>
      )}
    </div>
  );
}
