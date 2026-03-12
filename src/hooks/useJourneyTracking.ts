'use client';

import { useCallback, useRef } from 'react';
import { Trip, JourneyStep, StepStatus } from '@/types/trip';
import { journeyDatabaseService } from '@/services/firebase/JourneyDatabaseService';

// ---------------------------------------------------------------------------
// Haversine — iki koordinat arasındaki mesafeyi kilometre cinsinden döndürür
// ---------------------------------------------------------------------------
function haversineKm(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Geofence eşiği: bir step'in "ziyaret edildi" sayılması için gereken mesafe
// ---------------------------------------------------------------------------
const GEOFENCE_RADIUS_KM = 0.15; // 150 metre

// ---------------------------------------------------------------------------
// Tek bir step'i tracked'e geçir
// ---------------------------------------------------------------------------
export async function markStepAsTracked(
  journey: Trip,
  stepId: string,
  realCoords: [number, number],
): Promise<Trip> {
  const updatedSteps: JourneyStep[] = journey.steps.map((s) =>
    s.id === stepId
      ? {
          ...s,
          status: 'tracked' as StepStatus,
          trackedCoordinates: realCoords,
          trackedAt: Date.now(),
        }
      : s,
  );

  await journeyDatabaseService.updateJourney({
    id: journey.id,
    steps: updatedSteps,
  });

  return { ...journey, steps: updatedSteps };
}

// ---------------------------------------------------------------------------
// Tüm trip'i "aktif takip" moduna al (tüm planned → hâlâ planned, sadece
// trip.trackingStartedAt setlenir — gerçek geçişler GPS ile olur)
// ---------------------------------------------------------------------------
export async function startTracking(journey: Trip): Promise<Trip> {
  // Tüm adımları planned'a sıfırla (yeniden başlatma senaryosu)
  const resetSteps: JourneyStep[] = journey.steps.map((s) => ({
    ...s,
    status: 'planned' as StepStatus,
    trackedCoordinates: undefined,
    trackedAt: undefined,
  }));

  await journeyDatabaseService.updateJourney({
    id: journey.id,
    steps: resetSteps,
  });

  return { ...journey, steps: resetSteps };
}

// ---------------------------------------------------------------------------
// React Hook — GPS izleme döngüsünü yönetir
// ---------------------------------------------------------------------------
export interface UseJourneyTrackingOptions {
  /** Kullanıcı bir step'e yaklaştığında çağrılır */
  onStepReached?: (step: JourneyStep, updatedJourney: Trip) => void;
  /** GPS hatası */
  onError?: (err: GeolocationPositionError) => void;
  /** Geofence yarıçapı (km), varsayılan 0.15 */
  radiusKm?: number;
}

export function useJourneyTracking(options: UseJourneyTrackingOptions = {}) {
  const { onStepReached, onError, radiusKm = GEOFENCE_RADIUS_KM } = options;
  const watchIdRef = useRef<number | null>(null);
  const journeyRef = useRef<Trip | null>(null);

  /** Takibi başlat */
  const startWatching = useCallback(
    (journey: Trip) => {
      if (!navigator.geolocation) return;
      journeyRef.current = journey;

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const userCoords: [number, number] = [
            pos.coords.longitude,
            pos.coords.latitude,
          ];
          const current = journeyRef.current;
          if (!current) return;

          // Henüz tracked olmayan ilk planned step'i bul
          const nextStep = current.steps.find((s) => (s.status ?? 'planned') === 'planned');
          if (!nextStep) {
            // Tüm adımlar tamamlandı — izlemeyi durdur
            stopWatching();
            return;
          }

          const dist = haversineKm(userCoords, nextStep.coordinates);

          // %90 yakınlık = 0.15 km eşiğinin içinde
          if (dist <= radiusKm) {
            const updated = await markStepAsTracked(current, nextStep.id, userCoords);
            journeyRef.current = updated;
            onStepReached?.(nextStep, updated);
          }
        },
        (err) => onError?.(err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    },
    [onStepReached, onError, radiusKm],
  );

  /** Takibi durdur */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    journeyRef.current = null;
  }, []);

  return { startWatching, stopWatching, haversineKm };
}
