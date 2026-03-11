'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Globe,
  Users,
  Lock,
  Sparkles,
  Search,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';
import { Trip } from '@/types/trip';
import { useTrippo } from '@/hooks/useTrippo';

type Privacy = 'public' | 'friends' | 'only_me';

interface JourneyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}

const PRIVACY_OPTIONS: {
  id: Privacy;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'public',
    label: 'Public',
    desc: 'Anyone can discover this trip',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    id: 'friends',
    label: 'Friends',
    desc: 'Only your friends can see this',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'only_me',
    label: 'Only Me',
    desc: 'Completely private — just for you',
    icon: <Lock className="w-5 h-5" />,
  },
];

const STEP_TITLES = [
  'Where are you going?',
  'When are you going?',
  'Who can see this?',
  'Let Trippo help you',
];

const STEP_SUBTITLES = [
  'Search for a city or destination',
  'Set your travel dates',
  'Choose your privacy setting',
  'AI-powered itinerary generation',
];

const ACCENT = '#3b82f6';

export default function JourneyCreationModal({
  isOpen,
  onClose,
  onCreated,
}: JourneyCreationModalProps) {
  const { user } = useAuth();
  const { chat: trippoChat } = useTrippo();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — destination
  const [destination, setDestination] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Step 2 — dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 3 — privacy
  const [privacy, setPrivacy] = useState<Privacy>('public');

  // Step 4 — trippo
  const [trippoEnabled, setTrippoEnabled] = useState(false);

  const totalSteps = 4;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const reset = () => {
    setStep(0);
    setDirection(1);
    setDestination('');
    setLocationQuery('');
    setStartDate('');
    setEndDate('');
    setPrivacy('public');
    setTrippoEnabled(false);
    setSaving(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const canGoNext = () => {
    if (step === 0) return destination.trim().length > 0;
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Trippo ile itinerary oluşturulacaksa önce AI'dan al
      let trippoDescription: string | undefined;
      if (trippoEnabled) {
        const dateContext = startDate && endDate
          ? ` Tarihler: ${startDate} - ${endDate}.`
          : '';
        const result = await trippoChat(
          `${destination} için${dateContext} kısa, ilham verici bir seyahat özeti yaz. Sadece 2-3 cümle.`,
        );
        if (result?.text) {
          trippoDescription = result.text;
        }
      }

      const created = await journeyDatabaseService.createJourney(
        {
          name: destination.trim(),
          color: ACCENT,
          isPublic: privacy === 'public',
          steps: [],
          ...(trippoDescription ? { description: trippoDescription } : {}),
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        },
        user.uid,
      );

      onCreated(created);
      handleClose();
    } catch (err) {
      console.error('Failed to create journey:', err);
    } finally {
      setSaving(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 36 : -36 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -36 : 36 }),
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="jcm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="jcm-sheet"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-[201] bg-white rounded-t-3xl shadow-2xl shadow-black/25 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1 w-full" style={{ backgroundColor: ACCENT }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>

            {/* Step progress dots */}
            <div className="flex items-center justify-center gap-2 pt-1 pb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === step ? 24 : 8,
                    backgroundColor: i <= step ? ACCENT : '#e2e8f0',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pb-4">
              <div>
                <h2 className="text-slate-900 font-bold text-xl leading-tight">
                  {STEP_TITLES[step]}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {STEP_SUBTITLES[step]}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-black/6 hover:bg-black/10 flex items-center justify-center transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Step body */}
            <div className="overflow-hidden px-6" style={{ minHeight: 200 }}>
              <AnimatePresence mode="wait" custom={direction}>
                {/* STEP 0 — Destination */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {/* Search field */}
                    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#f8fafc] border border-black/8 focus-within:border-blue-400 transition-colors">
                      <Search className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        autoFocus
                        placeholder="Paris, Tokyo, New York…"
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          setDestination(e.target.value);
                        }}
                        className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-300 text-base outline-none"
                      />
                      {locationQuery.length > 0 && (
                        <button
                          onClick={() => { setLocationQuery(''); setDestination(''); }}
                          className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0"
                        >
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                      )}
                    </div>

                    {/* Location icon hint */}
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <MapPin className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
                        <p className="text-slate-400 text-sm text-center">
                          Type a destination to get started
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1 — Dates */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#f8fafc] border border-black/8 text-slate-800 focus:outline-none focus:border-blue-400 text-base transition-colors"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl bg-[#f8fafc] border border-black/8 text-slate-800 focus:outline-none focus:border-blue-400 text-base transition-colors"
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      Dates are optional — you can add them later.
                    </p>
                  </motion.div>
                )}

                {/* STEP 2 — Privacy */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col gap-3"
                  >
                    {PRIVACY_OPTIONS.map((opt) => {
                      const selected = privacy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPrivacy(opt.id)}
                          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all"
                          style={{
                            borderColor: selected ? ACCENT : 'rgba(0,0,0,0.07)',
                            backgroundColor: selected ? '#eff6ff' : '#f8fafc',
                          }}
                        >
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              backgroundColor: selected ? '#dbeafe' : 'rgba(0,0,0,0.05)',
                              color: selected ? ACCENT : '#94a3b8',
                            }}
                          >
                            {opt.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-sm"
                              style={{ color: selected ? ACCENT : '#1e293b' }}
                            >
                              {opt.label}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                          </div>
                          {selected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: ACCENT }}
                            >
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </motion.span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}

                {/* STEP 3 — Trippo */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {/* Toggle card */}
                    <button
                      onClick={() => setTrippoEnabled((v) => !v)}
                      className="w-full rounded-2xl border text-left overflow-hidden transition-all"
                      style={{
                        borderColor: trippoEnabled ? ACCENT : 'rgba(0,0,0,0.07)',
                        backgroundColor: trippoEnabled ? '#eff6ff' : '#f8fafc',
                      }}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor: trippoEnabled ? ACCENT : 'rgba(0,0,0,0.06)',
                          }}
                        >
                          <Sparkles
                            className="w-5 h-5"
                            style={{ color: trippoEnabled ? '#fff' : '#94a3b8' }}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="font-bold text-sm"
                              style={{ color: trippoEnabled ? ACCENT : '#1e293b' }}
                            >
                              Let Trippo generate your route
                            </p>
                            {/* Toggle switch */}
                            <div
                              className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
                              style={{ backgroundColor: trippoEnabled ? ACCENT : 'rgba(0,0,0,0.1)' }}
                            >
                              <motion.div
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                animate={{ x: trippoEnabled ? 22 : 4 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Trippo will create a smart itinerary based on your destination and travel dates.
                          </p>
                        </div>
                      </div>

                      {/* Expanded feature list */}
                      <AnimatePresence>
                        {trippoEnabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-4 mb-4 rounded-xl px-3 py-2.5 flex flex-col gap-2 bg-blue-50">
                              {[
                                'Day-by-day itinerary',
                                'Curated spots & stays',
                                'Optimised travel routes',
                              ].map((f) => (
                                <div key={f} className="flex items-center gap-2">
                                  <Check
                                    className="w-3.5 h-3.5 shrink-0 text-blue-500"
                                    strokeWidth={3}
                                  />
                                  <span className="text-xs text-slate-600">{f}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>

                    <p className="text-xs text-slate-400 text-center mt-4">
                      You can always edit or add stops manually later.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 pt-5 pb-8 flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={goBack}
                  className="flex items-center justify-center gap-1 px-4 py-3.5 rounded-2xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-600 font-semibold text-sm transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <button
                onClick={step < totalSteps - 1 ? goNext : handleSave}
                disabled={!canGoNext() || saving}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ backgroundColor: ACCENT }}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step < totalSteps - 1 ? (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {trippoEnabled ? 'Create with Trippo' : 'Create Journey'}
                    {trippoEnabled && <Sparkles className="w-4 h-4" />}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    typeof document !== 'undefined' ? document.body : (null as unknown as Element),
  );
}
