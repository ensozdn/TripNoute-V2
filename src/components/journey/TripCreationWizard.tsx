'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Footprints, History, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TripCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

type TripType = 'future' | 'current' | 'past';

export default function TripCreationWizard({ isOpen, onClose }: TripCreationWizardProps) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<TripType | null>(null);

    const handleContinue = () => {
        if (!selectedType) return;

        router.push(`/places/add?mode=${selectedType}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {}
                        <div className="flex justify-center pt-3 pb-2" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>

                        {}
                        <div className="px-6 pb-8 pt-2 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 pr-8">
                                    What kind of trip do you want to add?
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <p className="text-slate-500 mb-8">
                                Don't worry, you can change this later.
                            </p>

                            {}
                            <div className="space-y-4 mb-8">
                                {}
                                <button
                                    onClick={() => setSelectedType('future')}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedType === 'future'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${selectedType === 'future' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <span className={`font-medium text-lg ${selectedType === 'future' ? 'text-blue-900' : 'text-slate-700'
                                        }`}>
                                        I want to plan a future trip
                                    </span>
                                    {selectedType === 'future' && (
                                        <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]" />
                                    )}
                                    {selectedType !== 'future' && (
                                        <div className="ml-auto w-4 h-4 rounded-full border-2 border-slate-200" />
                                    )}
                                </button>

                                {}
                                <button
                                    onClick={() => setSelectedType('current')}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedType === 'current'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${selectedType === 'current' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <Footprints className="w-6 h-6" />
                                    </div>
                                    <span className={`font-medium text-lg ${selectedType === 'current' ? 'text-blue-900' : 'text-slate-700'
                                        }`}>
                                        I'm currently traveling
                                    </span>
                                    {selectedType === 'current' && (
                                        <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]" />
                                    )}
                                    {selectedType !== 'current' && (
                                        <div className="ml-auto w-4 h-4 rounded-full border-2 border-slate-200" />
                                    )}
                                </button>

                                {}
                                <button
                                    onClick={() => setSelectedType('past')}
                                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedType === 'past'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${selectedType === 'past' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        <History className="w-6 h-6" />
                                    </div>
                                    <span className={`font-medium text-lg ${selectedType === 'past' ? 'text-blue-900' : 'text-slate-700'
                                        }`}>
                                        I want to add a past trip
                                    </span>
                                    {selectedType === 'past' && (
                                        <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]" />
                                    )}
                                    {selectedType !== 'past' && (
                                        <div className="ml-auto w-4 h-4 rounded-full border-2 border-slate-200" />
                                    )}
                                </button>
                            </div>

                            {}
                            <div className="space-y-3">
                                <button
                                    onClick={handleContinue}
                                    disabled={!selectedType}
                                    className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-xl"
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="h-safe bg-white" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
