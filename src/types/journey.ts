/**
 * TripNoute v2 - Journey Hub Types
 * 
 * Type definitions for the Journey Hub tabbed interface.
 * Single Responsibility: Only journey-related type definitions.
 */

// ============================================
// TAB TYPES
// ============================================

export type TabType = 'timeline' | 'insights' | 'gallery';

export interface TabConfig {
  id: TabType;
  label: string;
  iconName: 'map' | 'chart-bar' | 'image';
}

export const TAB_CONFIG: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', iconName: 'map' },
  { id: 'insights', label: 'Insights', iconName: 'chart-bar' },
  { id: 'gallery', label: 'Gallery', iconName: 'image' },
];

// ============================================
// INSIGHTS TYPES
// ============================================

export interface JourneyStats {
  totalPlaces: number;
  totalPhotos: number;
  totalDistance: number; // in km
  countriesVisited: number;
  citiesVisited: number;
  firstTripDate: Date | null;
  lastTripDate: Date | null;
}

export interface PlaceFrequency {
  country: string;
  count: number;
}

// ============================================
// GALLERY TYPES
// ============================================

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  placeId: string;
  placeTitle: string;
  width: number;
  height: number;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface JourneyHubProps {
  className?: string;
}

export interface JourneyTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface TimelineTabProps {
  className?: string;
}

export interface InsightsTabProps {
  stats: JourneyStats;
  placeFrequencies: PlaceFrequency[];
  className?: string;
}

export interface GalleryTabProps {
  photos: GalleryPhoto[];
  className?: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}
