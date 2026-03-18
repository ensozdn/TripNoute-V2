'use client';

import { motion } from 'framer-motion';
import { 
  Car, 
  Backpack, 
  Sailboat, 
  Plane, 
  Bike, 
  Train,
  Globe
} from 'lucide-react';

export type TripCategory = 'all' | 'roadtrip' | 'backpacking' | 'sailing' | 'flight' | 'cycling' | 'rail';

interface CategoryFilterProps {
  activeCategory: TripCategory;
  onCategoryChange: (category: TripCategory) => void;
}

const categories = [
  { id: 'all' as TripCategory, label: 'All Journeys', icon: Globe },
  { id: 'roadtrip' as TripCategory, label: 'Road Trip', icon: Car },
  { id: 'backpacking' as TripCategory, label: 'Backpacking', icon: Backpack },
  { id: 'sailing' as TripCategory, label: 'Sailing', icon: Sailboat },
  { id: 'flight' as TripCategory, label: 'Flight', icon: Plane },
  { id: 'cycling' as TripCategory, label: 'Cycling', icon: Bike },
  { id: 'rail' as TripCategory, label: 'Rail', icon: Train },
];

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="relative">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onCategoryChange(category.id)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap
                transition-all duration-300 active:scale-95
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              <span>{category.label}</span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
