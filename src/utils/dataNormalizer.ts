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

export const getNormalizedCountry = (place: { address?: { country?: string } }): string => {
  return normalizeGeographicName(place.address?.country);
};

export const getNormalizedCity = (place: { address?: { city?: string } }): string => {
  return normalizeGeographicName(place.address?.city);
};

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

export const sortByFrequency = (
  frequencyMap: Map<string, number>
): [string, number][] => {
  return Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);
};
