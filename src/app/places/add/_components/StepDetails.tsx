'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, FileText, Tag } from 'lucide-react';
import type { SelectedLocation } from './StepLocation';

export interface PlaceDetails {
  name: string;
  country: string;
  city: string;
  visitDate: string;
  notes: string;
}

interface StepDetailsProps {
  details: PlaceDetails;
  selectedLocation: SelectedLocation;
  onChange: (details: PlaceDetails) => void;
  onContinue: () => void;
  error?: string;
}

function InputField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
        <span className="text-slate-300">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl bg-black/4 border border-black/10 text-slate-900 text-sm placeholder:text-slate-300 focus:outline-none focus:border-blue-500/60 focus:bg-blue-500/4 transition-all';

export default function StepDetails({
  details,
  selectedLocation,
  onChange,
  onContinue,
  error,
}: StepDetailsProps) {
  const isValid = details.name.trim().length >= 2 && details.visitDate;

  const set = (key: keyof PlaceDetails) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange({ ...details, [key]: e.target.value });

  return (
    <motion.div
      key="step-details"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto"
    >
      {/* Spacer for WizardProgress bar */}
      <div className="h-[88px] shrink-0" />

      <div className="flex-1 px-5 pb-36 space-y-6 pt-4">

        {/* Selected location pill */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-blue-500/8 border border-blue-500/15">
          <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-blue-500" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-blue-500/70 font-semibold uppercase tracking-wider mb-0.5">Selected location</p>
            <p className="text-sm text-slate-700 truncate">
              {selectedLocation.address
                ? selectedLocation.address.split(',').slice(0, 2).join(', ')
                : `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Place name */}
        <InputField label="Place Name *" icon={<Tag className="w-3 h-3" />}>
          <input
            type="text"
            value={details.name}
            onChange={set('name')}
            placeholder="e.g. Eiffel Tower"
            maxLength={100}
            className={inputCls}
            autoFocus
          />
        </InputField>

        {/* City + Country row */}
        <div className="grid grid-cols-2 gap-3">
          <InputField label="City" icon={<MapPin className="w-3 h-3" />}>
            <input
              type="text"
              value={details.city}
              onChange={set('city')}
              placeholder="Paris"
              maxLength={50}
              className={inputCls}
            />
          </InputField>
          <InputField label="Country" icon={<MapPin className="w-3 h-3" />}>
            <input
              type="text"
              value={details.country}
              onChange={set('country')}
              placeholder="France"
              maxLength={50}
              className={inputCls}
            />
          </InputField>
        </div>

        {/* Visit date */}
        <InputField label="Visit Date *" icon={<Calendar className="w-3 h-3" />}>
          <input
            type="date"
            value={details.visitDate}
            onChange={set('visitDate')}
            className={inputCls}
          />
        </InputField>

        {/* Notes */}
        <InputField label="Notes" icon={<FileText className="w-3 h-3" />}>
          <textarea
            value={details.notes}
            onChange={set('notes')}
            placeholder="Share your experience, tips, or memories..."
            rows={4}
            maxLength={1000}
            className={`${inputCls} resize-none`}
          />
          <p className="text-right text-xs text-slate-300 mt-1">
            {details.notes.length} / 1000
          </p>
        </InputField>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-10 pt-6 bg-gradient-to-t from-white via-white/95 to-transparent">
        <motion.button
          onClick={onContinue}
          disabled={!isValid}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all
            disabled:bg-black/6 disabled:text-slate-300 disabled:cursor-not-allowed
            bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl shadow-blue-500/25"
        >
          Continue →
        </motion.button>
      </div>
    </motion.div>
  );
}