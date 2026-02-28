'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Sparkles,
  BedDouble,
  MapPin,
  Navigation,
  Footprints,
} from 'lucide-react';

type ActiveMode = 'plan' | 'track';

interface JourneyActionMenuProps {
  activeMode: ActiveMode;
  onCreateItinerary: () => void;
  onAddStay?: () => void;
  onAddSpot?: () => void;
  onAddDestination?: () => void;
  onAddFirstStep?: () => void;
}

export default function JourneyActionMenu({
  activeMode,
  onCreateItinerary,
  onAddStay,
  onAddSpot,
  onAddDestination,
  onAddFirstStep,
}: JourneyActionMenuProps) {
  const [open, setOpen] = useState(false);

  const planItems = [
    {
      id: 'itinerary',
      label: 'Create Itinerary with Trippo',
      sublabel: 'AI-generated route & stops',
      icon: <Sparkles className="w-4 h-4" />,
      primary: true,
      action: onCreateItinerary,
    },
    {
      id: 'stay',
      label: 'Add a stay',
      sublabel: 'Hotel, hostel, Airbnb…',
      icon: <BedDouble className="w-4 h-4" />,
      primary: false,
      action: onAddStay,
    },
    {
      id: 'spot',
      label: 'Add a spot',
      sublabel: 'Restaurant, cafe, landmark…',
      icon: <MapPin className="w-4 h-4" />,
      primary: false,
      action: onAddSpot,
    },
    {
      id: 'destination',
      label: 'Add a destination',
      sublabel: 'City or region',
      icon: <Navigation className="w-4 h-4" />,
      primary: false,
      action: onAddDestination,
    },
  ];

  const trackItems = [
    {
      id: 'step',
      label: 'Add your first step',
      sublabel: 'Start tracking your journey',
      icon: <Footprints className="w-4 h-4" />,
      primary: false,
      action: onAddFirstStep,
    },
  ];

  const items = activeMode === 'plan' ? planItems : trackItems;

  const handleItem = (action?: () => void) => {
    setOpen(false);
    setTimeout(() => action?.(), 160);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="action-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[48]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu items */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="action-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-[68px] left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[49]"
            style={{ width: 240 }}
          >
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{
                  duration: 0.18,
                  delay: (items.length - 1 - i) * 0.05,
                }}
                onClick={() => handleItem(item.action)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.97] shadow-lg shadow-black/8"
                style={
                  item.primary
                    ? {
                        background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                        borderColor: 'transparent',
                      }
                    : {
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(0,0,0,0.07)',
                      }
                }
              >
                {/* Icon */}
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={
                    item.primary
                      ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                      : { backgroundColor: 'rgba(0,0,0,0.05)', color: '#64748b' }
                  }
                >
                  {item.icon}
                </span>
                {/* Text */}
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm leading-tight"
                    style={{ color: item.primary ? '#fff' : '#1e293b' }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-tight"
                    style={{ color: item.primary ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}
                  >
                    {item.sublabel}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.88 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 relative z-[49]"
        style={{
          background: open
            ? '#94a3b8'
            : 'linear-gradient(135deg,#3b82f6,#2563eb)',
        }}
      >
        {open
          ? <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          : <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        }
      </motion.button>
    </div>
  );
}
