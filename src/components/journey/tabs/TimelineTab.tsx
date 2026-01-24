/**
 * TimelineTab Component
 * 
 * Wrapper for TravelTimeline within JourneyHub.
 * Single Responsibility: Only manages timeline display within tab context.
 */

'use client';

import { motion } from 'framer-motion';
import TravelTimeline from '@/components/timeline/TravelTimeline';
import { Place } from '@/types';

interface TimelineTabProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
}

export default function TimelineTab({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
}: TimelineTabProps) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full px-4 pb-4 overflow-y-auto"
    >
      <TravelTimeline
        places={places}
        selectedPlaceId={selectedPlaceId}
        onPlaceSelect={onPlaceSelect}
        onPlaceDelete={onPlaceDelete}
        onPlaceEdit={onPlaceEdit}
      />
    </motion.div>
  );
}
