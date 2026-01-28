/**
 * TransportSelector Component
 * Premium UI for selecting transport mode
 */

import { motion } from 'framer-motion';
import { Plane, Car, Bus, Footprints, Ship, Train } from 'lucide-react';
import { TransportType } from '@/types';

interface TransportSelectorProps {
    value: TransportType | undefined;
    onChange: (value: TransportType) => void;
    className?: string;
}

const transportOptions: { id: TransportType; label: string; icon: any }[] = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'car', label: 'Car', icon: Car },
    { id: 'bus', label: 'Bus', icon: Bus },
    { id: 'ship', label: 'Ship', icon: Ship },
    { id: 'walking', label: 'Walk', icon: Footprints },
];

export default function TransportSelector({ value, onChange, className = '' }: TransportSelectorProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <label className="text-sm font-medium text-slate-400 pl-1">
                How did you get here?
            </label>

            <div className="relative flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 overflow-hidden">
                {transportOptions.map((option) => {
                    const isSelected = value === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => onChange(option.id)}
                            className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 z-10 ${isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            type="button"
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="active-transport-pill"
                                    className="absolute inset-0 bg-blue-500/20 border border-blue-500/30 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            <div className={`relative ${isSelected ? 'text-blue-400' : 'text-current'}`}>
                                <option.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium relative">{option.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
