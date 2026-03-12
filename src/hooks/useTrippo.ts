import { useState } from 'react';

interface PlaceInfoResult {
  tips: string[];
  vibe: string;
}

interface ChatResult {
  text: string;
}

interface HistoryMessage {
  role: 'user' | 'trippo';
  text: string;
}

export function useTrippo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (type: 'place_info' | 'chat' | 'generate_itinerary', payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trippo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hata oluştu');
      return json.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPlaceInfo = (placeName: string, lat: number, lng: number): Promise<PlaceInfoResult | null> =>
    ask('place_info', { placeName, lat, lng });

  const chat = (message: string, context?: string, history?: HistoryMessage[]): Promise<ChatResult | null> =>
    ask('chat', { message, context, history });

  /**
   * Bir destinasyon için AI destekli planned adım listesi üretir.
   * Dönen her adım `status: 'planned'` ile işaretlidir.
   */
  const generateItinerary = (
    destination: string,
    opts?: { startDate?: string; endDate?: string; days?: number },
  ): Promise<{ steps: Array<{ order: number; name: string; lat: number; lng: number; notes?: string; day?: number; status: 'planned' }> } | null> =>
    ask('generate_itinerary', { destination, ...opts });

  return { getPlaceInfo, chat, generateItinerary, loading, error };
}
