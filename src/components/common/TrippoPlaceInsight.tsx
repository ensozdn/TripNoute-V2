'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useTrippo } from '@/hooks/useTrippo';

interface TrippoPlaceInsightProps {
  placeName: string;
  lat: number;
  lng: number;
}

export default function TrippoPlaceInsight({ placeName, lat, lng }: TrippoPlaceInsightProps) {
  const [expanded, setExpanded] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const { getPlaceInfo, loading } = useTrippo();

  const fetchInsights = async () => {
    const result = await getPlaceInfo(placeName, lat, lng);
    if (result) {
      setTips(result.tips);
      setVibe(result.vibe);
    }
  };

  const handleToggle = () => {
    if (!expanded && !tips) {
      fetchInsights();
    }
    setExpanded((v) => !v);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-100">
      {/* Trigger button */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
        style={{
          background: expanded
            ? 'linear-gradient(to right, #eff6ff, #eef2ff)'
            : 'linear-gradient(to right, #f8fafc, #f0f4ff)',
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-slate-800 text-sm">Trippo İçgörüleri</p>
          {vibe && expanded ? (
            <p className="text-xs text-blue-500 font-medium truncate">{vibe}</p>
          ) : (
            <p className="text-xs text-slate-400">Bu mekan hakkında AI bilgisi al</p>
          )}
        </div>
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin shrink-0" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 bg-white flex flex-col gap-2">
              {loading && !tips ? (
                <div className="flex flex-col gap-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 rounded-full bg-slate-100 animate-pulse" style={{ width: `${70 + i * 8}%` }} />
                  ))}
                </div>
              ) : tips ? (
                <>
                  {tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-500 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}

                  {/* Refresh */}
                  <button
                    onClick={(e) => { e.stopPropagation(); fetchInsights(); }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors mt-1 self-end"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Yenile
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400 py-2 text-center">
                  Bilgi alınamadı, tekrar dene.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
