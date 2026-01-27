/**
 * Data Normalizer Utility
 * 
 * Normalize place data to ensure consistency:
 * - Case-insensitive country/city names
 * - Remove duplicates (e.g., "Turkey" vs "turkey")
 * - Proper capitalization for display
 */

/**
 * Normalize a geographic name (country/city)
 * Converts to lowercase then capitalizes first letter
 * 
 * @param name - The geographic name to normalize
 * @returns Normalized name (e.g., "turkey" → "Turkey")
 */
export const normalizeGeographicName = (name: string | undefined | null): string => {
  if (!name || typeof name !== 'string') {
    return 'Unknown';
  }

  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get normalized country name for consistent grouping
 * Used for deduplication and statistics
 * 
 * @param place - The place object
 * @returns Normalized country name
 */
export const getNormalizedCountry = (place: { address?: { country?: string } }): string => {
  return normalizeGeographicName(place.address?.country);
};

/**
 * Get normalized city name for consistent grouping
 * 
 * @param place - The place object
 * @returns Normalized city name
 */
export const getNormalizedCity = (place: { address?: { city?: string } }): string => {
  return normalizeGeographicName(place.address?.city);
};

/**
 * Deduplicate places by normalized country
 * Creates a Map where key is normalized country name
 * 
 * @param places - Array of places
 * @returns Map of normalized country → count
 */
export const deduplicateCountries = (
  places: Array<{ address?: { country?: string } }>
): Map<string, number> => {
  const countryMap = new Map<string, number>();

  places.forEach((place) => {
    const normalizedCountry = getNormalizedCountry(place);
    if (normalizedCountry !== 'Unknown') {
      countryMap.set(
        normalizedCountry,
        (countryMap.get(normalizedCountry) || 0) + 1
      );
    }
  });

  return countryMap;
};

/**
 * Deduplicate places by normalized city
 * Creates a Map where key is normalized city name
 * 
 * @param places - Array of places
 * @returns Map of normalized city → count
 */
export const deduplicateCities = (
  places: Array<{ address?: { city?: string } }>
): Map<string, number> => {
  const cityMap = new Map<string, number>();

  places.forEach((place) => {
    const normalizedCity = getNormalizedCity(place);
    if (normalizedCity !== 'Unknown') {
      cityMap.set(
        normalizedCity,
        (cityMap.get(normalizedCity) || 0) + 1
      );
    }
  });

  return cityMap;
};

/**
 * Sort frequency map by count (descending)
 * 
 * @param frequencyMap - Map of name → count
 * @returns Array of [name, count] sorted by count
 */
export const sortByFrequency = (
  frequencyMap: Map<string, number>
): [string, number][] => {
  return Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);
};
