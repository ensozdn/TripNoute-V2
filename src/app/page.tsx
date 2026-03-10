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

// ── Animated Logo ─────────────────────────────────────────────────────────────
function AnimatedLogo() {
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <motion.div
        className="absolute w-28 h-28 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{ border: '1px solid rgba(59,130,246,0.3)' }}
        animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{ border: '1px solid rgba(59,130,246,0.22)' }}
        animate={{ scale: [1, 1.45], opacity: [0.4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.1 }}
      />
      <motion.div
        className="relative w-20 h-20 rounded-[22px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%)',
          boxShadow: '0 20px 60px rgba(37,99,235,0.38), 0 4px 16px rgba(37,99,235,0.22), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)' }}
        />
        <motion.svg
          width="36" height="36" viewBox="0 0 24 24" fill="none"
          animate={{ rotate: [0, -3, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="white"/>
        </motion.svg>
      </motion.div>
    </div>
  );
}

// ── Decorative background ─────────────────────────────────────────────────────
function Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', filter: 'blur(36px)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute top-1/2 -left-16 w-56 h-56 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.05) 0%, transparent 70%)', filter: 'blur(30px)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" fill="none">
        <motion.path
          d="M -10 700 Q 60 560 140 460 Q 210 370 300 280 Q 355 220 420 160"
          stroke="#2563eb" strokeWidth="1.3" strokeDasharray="7 5" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.22 }}
          transition={{ duration: 2.8, ease: 'easeInOut', delay: 0.3 }}
        />
        <motion.path
          d="M 420 740 Q 310 620 230 510 Q 150 400 70 310 Q 30 260 -10 210"
          stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 7" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.16 }}
          transition={{ duration: 3.2, ease: 'easeInOut', delay: 0.8 }}
        />
        <motion.path
          d="M 30 220 Q 120 170 200 155 Q 280 140 360 165"
          stroke="#60a5fa" strokeWidth="0.9" strokeDasharray="4 6" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.14 }}
          transition={{ duration: 2.4, ease: 'easeInOut', delay: 1.4 }}
        />
        <motion.path
          d="M 10 780 Q 100 720 180 680 Q 270 640 360 620 Q 390 615 420 610"
          stroke="#93c5fd" strokeWidth="0.9" strokeDasharray="4 8" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.12 }}
          transition={{ duration: 2.6, ease: 'easeInOut', delay: 1.8 }}
        />

        {[{ cx: 140, cy: 460 }, { cx: 300, cy: 280 }, { cx: 60, cy: 580 }].map(({ cx, cy }, i) => (
          <motion.g key={`dot1-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6 + i * 0.35, duration: 0.4, ease: 'backOut' }}>
            <circle cx={cx} cy={cy} r="4.5" fill="#2563eb" opacity="0.18" />
            <circle cx={cx} cy={cy} r="2.2" fill="#2563eb" opacity="0.42" />
            <motion.circle cx={cx} cy={cy} r="4.5" stroke="#2563eb" strokeWidth="1" fill="none"
              animate={{ r: [4.5, 12], opacity: [0.28, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: i * 0.7 }} />
          </motion.g>
        ))}

        {[{ cx: 230, cy: 510 }, { cx: 70, cy: 310 }].map(({ cx, cy }, i) => (
          <motion.g key={`dot2-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2 + i * 0.4, duration: 0.4, ease: 'backOut' }}>
            <circle cx={cx} cy={cy} r="3.5" fill="#3b82f6" opacity="0.18" />
            <circle cx={cx} cy={cy} r="1.8" fill="#3b82f6" opacity="0.38" />
            <motion.circle cx={cx} cy={cy} r="3.5" stroke="#3b82f6" strokeWidth="1" fill="none"
              animate={{ r: [3.5, 10], opacity: [0.24, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 1.2 + i * 0.8 }} />
          </motion.g>
        ))}

        {[{ cx: 200, cy: 155 }, { cx: 360, cy: 165 }].map(({ cx, cy }, i) => (
          <motion.g key={`dot3-${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.8 + i * 0.3, duration: 0.35, ease: 'backOut' }}>
            <circle cx={cx} cy={cy} r="3" fill="#60a5fa" opacity="0.2" />
            <circle cx={cx} cy={cy} r="1.5" fill="#60a5fa" opacity="0.42" />
            <motion.circle cx={cx} cy={cy} r="3" stroke="#60a5fa" strokeWidth="0.8" fill="none"
              animate={{ r: [3, 8], opacity: [0.22, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: i * 0.9 }} />
          </motion.g>
        ))}

        {/* ── Plane 1: sol-alttan sağ-üste, tek seferlik düzgün uçuş ── */}
        <motion.g
          style={{ rotate: 40 }}
          initial={{ x: -20, y: 730, opacity: 0 }}
          animate={{ x: 450, y: 120, opacity: [0, 0.65, 0.65, 0] }}
          transition={{ duration: 3.0, ease: 'easeInOut', delay: 0.5, times: [0, 0.12, 0.88, 1] }}
        >
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="#2563eb" transform="translate(-12, -12) scale(0.65)" />
        </motion.g>

        {/* ── Plane 2: sağ-alttan sol-üste, tek seferlik düzgün uçuş ── */}
        <motion.g
          style={{ rotate: -50 }}
          initial={{ x: 440, y: 730, opacity: 0 }}
          animate={{ x: -30, y: 180, opacity: [0, 0.55, 0.55, 0] }}
          transition={{ duration: 3.4, ease: 'easeInOut', delay: 1.2, times: [0, 0.12, 0.88, 1] }}
        >
          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="#3b82f6" transform="translate(-11, -11) scale(0.58)" />
        </motion.g>

        {[
          { x: 44,  y: 188, delay: 0.6,  color: '#2563eb', scale: 1 },
          { x: 346, y: 328, delay: 1.2,  color: '#3b82f6', scale: 0.85 },
          { x: 82,  y: 648, delay: 0.2,  color: '#2563eb', scale: 0.9 },
          { x: 362, y: 568, delay: 1.8,  color: '#60a5fa', scale: 0.8 },
          { x: 198, y: 118, delay: 0.9,  color: '#3b82f6', scale: 0.75 },
          { x: 290, y: 720, delay: 2.3,  color: '#93c5fd', scale: 0.7 },
          { x: 148, y: 340, delay: 1.5,  color: '#2563eb', scale: 0.65 },
        ].map(({ x, y, delay, color, scale }, i) => (
          <motion.g key={`pin-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: [0, 0.28, 0.28, 0], y: [8, 0, 0, -8] }}
            transition={{ duration: 4.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay }}>
            <circle cx={x} cy={y - 2} r={4 * scale} fill={color} opacity="0.45" />
            <circle cx={x} cy={y - 2} r={2 * scale} fill={color} opacity="0.7" />
            <line x1={x} y1={y + 2 * scale} x2={x} y2={y + 8 * scale}
              stroke={color} strokeWidth={1.4 * scale} opacity="0.35" strokeLinecap="round" />
          </motion.g>
        ))}

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0.08, 0.08, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }} style={{ transformOrigin: '195px 422px' }}>
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '195px 422px' }}>
            {[0, 45, 90, 135].map((angle, i) => (
              <line key={i} x1={195} y1={396} x2={195} y2={380}
                stroke="#2563eb" strokeWidth={i % 2 === 0 ? 1.2 : 0.8} strokeLinecap="round"
                transform={`rotate(${angle} 195 422)`} />
            ))}
          </motion.g>
          <circle cx={195} cy={422} r="3" fill="#2563eb" opacity="0.3" />
          <circle cx={195} cy={422} r="1.2" fill="#2563eb" opacity="0.6" />
        </motion.g>
      </svg>

      <div className="absolute inset-0 opacity-[0.022]"
        style={{ backgroundImage: 'radial-gradient(circle, #2563eb 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
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
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7"
      >
        <AnimatedLogo />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3"
      >
        <h1 className="text-[38px] font-bold tracking-[-0.02em] leading-none">
          <span className="text-slate-900">Trip</span>
          <span style={{ color: '#2563eb' }}>Noute</span>
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-slate-500 text-base font-medium mb-1.5"
      >
        Every journey deserves a story.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-slate-400 text-sm leading-relaxed mb-14 max-w-[260px]"
      >
        Plan, track and relive your travels — beautifully.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[300px] flex flex-col gap-3"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRegister}
          className="w-full py-4 rounded-2xl text-white font-bold text-[15px] tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.32), 0 2px 8px rgba(37,99,235,0.16)',
          }}
        >
          Get Started
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onLogin}
          className="w-full py-4 rounded-2xl font-semibold text-[15px] transition-all border text-slate-700"
          style={{
            backgroundColor: 'rgba(37,99,235,0.05)',
            borderColor: 'rgba(37,99,235,0.18)',
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
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors mb-8 w-fit">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="mb-8">
        <h2 className="text-slate-900 text-2xl font-bold mb-1 tracking-tight">Welcome back</h2>
        <p className="text-slate-400 text-sm">Sign in to continue your journey</p>
      </div>

      {displayError && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm text-red-500 border border-red-200 bg-red-50">
          {displayError}
        </div>
      )}

      <button onClick={handleGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm mb-5 transition-all active:scale-95 disabled:opacity-50 text-slate-700 bg-white hover:bg-slate-50"
        style={{ borderColor: 'rgba(0,0,0,0.10)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <GoogleIcon />
        {loading ? 'Please wait…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-slate-400 text-xs font-medium">or</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={loading} required
            className="w-full px-4 py-3.5 rounded-2xl text-slate-900 text-sm outline-none transition-all border border-slate-200 bg-white placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
        </div>

        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={loading} required
              className="w-full px-4 py-3.5 pr-12 rounded-2xl text-slate-900 text-sm outline-none transition-all border border-slate-200 bg-white placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-bold text-[15px] tracking-wide mt-2 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.28), 0 2px 8px rgba(37,99,235,0.15)',
          }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <button onClick={onGoRegister} className="text-blue-500 font-semibold hover:text-blue-600 transition-colors">
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
  const inputClass = "w-full px-4 py-3.5 rounded-2xl text-slate-900 text-sm outline-none transition-all border border-slate-200 bg-white placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";
  const inputStyle = { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col px-6 pt-14 pb-8 overflow-y-auto"
    >
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors mb-8 w-fit">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="mb-8">
        <h2 className="text-slate-900 text-2xl font-bold mb-1 tracking-tight">Create account</h2>
        <p className="text-slate-400 text-sm">Start your travel journey today</p>
      </div>

      {displayError && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm text-red-500 border border-red-200 bg-red-50">
          {displayError}
        </div>
      )}

      <button onClick={handleGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm mb-5 transition-all active:scale-95 disabled:opacity-50 text-slate-700 bg-white hover:bg-slate-50"
        style={{ borderColor: 'rgba(0,0,0,0.10)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <GoogleIcon />
        {loading ? 'Please wait…' : 'Sign up with Google'}
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-slate-400 text-xs font-medium">or</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
          <input type="text" placeholder="John Doe" value={displayName}
            onChange={(e) => setDisplayName(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={loading} required
              className={`${inputClass} pr-12`} style={inputStyle} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
          <input type="password" placeholder="••••••••" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required
            className={inputClass} style={inputStyle} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <div onClick={() => setAgreeToTerms(v => !v)}
            className="w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{
              backgroundColor: agreeToTerms ? '#2563eb' : 'white',
              borderColor: agreeToTerms ? '#2563eb' : 'rgba(0,0,0,0.15)',
              boxShadow: agreeToTerms ? '0 2px 8px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}>
            {agreeToTerms && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-slate-400 text-xs leading-relaxed">
            I agree to the{' '}
            <span className="text-blue-500 font-medium">Terms of Service</span>
            {' '}and{' '}
            <span className="text-blue-500 font-medium">Privacy Policy</span>
          </span>
        </label>

        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-bold text-[15px] tracking-wide mt-1 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.28), 0 2px 8px rgba(37,99,235,0.15)',
          }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Already have an account?{' '}
        <button onClick={onGoLogin} className="text-blue-500 font-semibold hover:text-blue-600 transition-colors">
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
      className="min-h-screen w-full relative overflow-hidden flex flex-col bg-white"
      style={{ background: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 50%, #dbeafe 100%)' }}
    >
      <Background />

      <div className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'splash' && (
            <SplashView key="splash" onLogin={() => setView('login')} onRegister={() => setView('register')} />
          )}
          {view === 'login' && (
            <LoginView key="login" onBack={() => setView('splash')} onGoRegister={() => setView('register')} />
          )}
          {view === 'register' && (
            <RegisterView key="register" onBack={() => setView('splash')} onGoLogin={() => setView('login')} />
          )}
        </AnimatePresence>
      </div>

      {view === 'splash' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          className="relative z-10 pb-8 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-blue-200" />
            <span className="text-xs font-semibold tracking-widest uppercase text-blue-400">
              Made for Travelers
            </span>
            <div className="h-px w-8 bg-blue-200" />
          </div>
          <p className="text-slate-300 text-[10px] tracking-wide">© 2026 TripNoute</p>
        </motion.div>
      )}
    </div>
  );
}
