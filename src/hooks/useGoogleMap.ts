/**
 * TripNoute v2 - useGoogleMap Hook (DEPRECATED)
 * 
 * This hook is deprecated. Use useMapbox instead.
 * Re-exports useMapbox for backward compatibility.
 */

'use client';

import { useMapbox } from './useMapbox';

/**
 * @deprecated Use useMapbox instead. GoogleMap integration has been replaced with Mapbox.
 */
export const useGoogleMap = useMapbox;

export default useGoogleMap;
