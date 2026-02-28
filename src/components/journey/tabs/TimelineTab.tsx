'use client';

import TravelTimeline from '@/components/timeline/TravelTimeline';
import { Place } from '@/types';

interface TimelineTabProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  onAddPlace?: () => void;
}

export default function TimelineTab({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  onAddPlace,
}: TimelineTabProps) {
  return (
    <TravelTimeline
      places={places}
      selectedPlaceId={selectedPlaceId}
      onPlaceSelect={onPlaceSelect}
      onPlaceDelete={onPlaceDelete}
      onPlaceEdit={onPlaceEdit}
      onAddPlace={onAddPlace}
    />
  );
}
