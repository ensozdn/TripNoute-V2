'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Route } from 'lucide-react';
import { Place } from '@/types';
import { Trip } from '@/types/trip';
import { useAuth } from '@/contexts/AuthContext';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';
import StepMeta from './StepMeta';
import StepWaypoints, { DraftStep } from './StepWaypoints';

type WizardStep = 'meta' | 'waypoints';

interface JourneyCreatorProps {
  isOpen: boolean;
  places: Place[];
  onClose: () => void;
  onCreated: (journey: Trip) => void;
  // Called when user taps "Tap on Map" — parent handles map interaction
  onRequestMapPin: (onPinDropped: (name: string, lat: number, lng: number) => void) => void;
}

export default function JourneyCreator({
  isOpen,
  places,
  onClose,
  onCreated,
  onRequestMapPin,
}: JourneyCreatorProps) {
  const { user } = useAuth();

  const [wizardStep, setWizardStep] = useState<WizardStep>('meta');
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  // When true, sheet hides so user can tap the map freely
  const [minimized, setMinimized] = useState(false);

  const resetState = () => {
    setWizardStep('meta');
    setName('');
    setSteps([]);
    setIsSaving(false);
    setMinimized(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestMapPin = useCallback(() => {
    // Hide the sheet so the user can interact with the map
    setMinimized(true);
    onRequestMapPin((pinName, lat, lng) => {
      // Pin was dropped — restore the sheet and add the waypoint
      setMinimized(false);
      const newStep: DraftStep = {
        _key: `map-${Date.now()}`,
        name: pinName || `Stop ${steps.length + 1}`,
        coordinates: [lng, lat],
        transportToNext: null,
      };
      setSteps((prev) => [...prev, newStep]);
    });
  }, [onRequestMapPin, steps.length]);

  const handleSave = async () => {
    if (!user || steps.length < 2 || isSaving) return;

    setIsSaving(true);
    try {
      const journey = await journeyDatabaseService.createJourney(
        {
          name: name.trim(),
          color: 'rgba(255,255,255,0.7)',
          isPublic: false,
          steps: steps.map((s, i) => ({
            name: s.name,
            coordinates: s.coordinates,
            timestamp: Date.now() + i,
            order: i,
            transportToNext: s.transportToNext,
            address: s.address,
            placeId: s.placeId,
          })),
        },
        user.uid,
      );
      resetState();
      onCreated(journey);
    } catch (err) {
      console.error('Failed to create journey:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && !minimized && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(to bottom, rgba(15,20,30,0.98), rgba(10,14,22,0.98))',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              maxHeight: '85vh',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
                  <Route className="w-4 h-4 text-white/70" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {wizardStep === 'meta' ? 'New Journey' : name || 'Add Waypoints'}
                  </p>
                  <p className="text-white/35 text-xs">
                    {wizardStep === 'meta' ? 'Step 1 of 2 — Details' : `Step 2 of 2 — ${steps.length} waypoint${steps.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" strokeWidth={2} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-3">
              <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: wizardStep === 'meta' ? '50%' : '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
              <AnimatePresence mode="wait">
                {wizardStep === 'meta' ? (
                  <StepMeta
                    key="meta"
                    name={name}
                    onNameChange={setName}
                    onNext={() => setWizardStep('waypoints')}
                  />
                ) : (
                  <StepWaypoints
                    key="waypoints"
                    steps={steps}
                    places={places}
                    onStepsChange={setSteps}
                    onRequestMapPin={handleRequestMapPin}
                    onBack={() => setWizardStep('meta')}
                    onSave={handleSave}
                    isSaving={isSaving}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
