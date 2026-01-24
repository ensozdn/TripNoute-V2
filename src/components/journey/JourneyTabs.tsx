/**
 * JourneyTabs Component
 * 
 * Floating segmented control with magic pill animation.
 * Single Responsibility: Only handles tab navigation UI and animation.
 */

'use client';

import { motion } from 'framer-motion';
import { Map, BarChart3, Image } from 'lucide-react';
import { TAB_CONFIG, JourneyTabsProps } from '@/types/journey';

const ICON_MAP = {
  map: Map,
  'chart-bar': BarChart3,
  image: Image,
};

export default function JourneyTabs({ activeTab, onTabChange }: JourneyTabsProps) {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Glassmorphism Tab Container */}
      <div className="relative flex items-center justify-between p-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
        {/* Magic Pill Background */}
        {TAB_CONFIG.map((tab) => (
          tab.id === activeTab && (
            <motion.div
              key="pill"
              layoutId="activeTabPill"
              className="absolute inset-y-1 rounded-xl bg-white/20 border border-white/30"
              style={{
                width: `calc(${100 / TAB_CONFIG.length}% - 4px)`,
                left: `calc(${TAB_CONFIG.findIndex(t => t.id === activeTab) * (100 / TAB_CONFIG.length)}% + 2px)`,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )
        ))}

        {/* Tab Buttons */}
        {TAB_CONFIG.map((tab) => {
          const IconComponent = ICON_MAP[tab.iconName];
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4
                text-sm font-medium transition-colors duration-200
                ${activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              <IconComponent className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
