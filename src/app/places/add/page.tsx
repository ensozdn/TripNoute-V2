/**
 * TripNoute v2 - Add Place Page
 * 
 * Form for adding a new place to the user's collection.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addPlaceSchema } from '@/utils/validators';
import { databaseService } from '@/lib/database';
import { googleMapsService } from '@/lib/googleMaps';
import { z } from 'zod';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

type AddPlaceFormData = z.infer<typeof addPlaceSchema>;

export default function AddPlacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [formData, setFormData] = useState<AddPlaceFormData>({
    name: '',
    country: '',
    city: '',
    visitDate: '',
    notes: '',
  });

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        // Get user's current location
        let initialCenter = { lat: 41.0082, lng: 28.9784 }; // Istanbul default
        let initialZoom = 3;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              initialCenter = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              initialZoom = 12;
              
              // Update map center if already created
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(initialCenter);
                mapInstanceRef.current.setZoom(initialZoom);
              }
              
              console.log('📍 User location:', initialCenter);
            },
            (error) => {
              console.warn('Geolocation error:', error);
            }
          );
        }

        const map = await googleMapsService.createMap(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);

        // Add click listener
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            
            setSelectedLocation({ lat, lng });

            // Remove old marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // Add new marker
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: 'Selected Location',
            });

            markerRef.current = marker;
            
            console.log('📍 Location selected:', { lat, lng });
          }
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingForm(true);

    try {
      // Validate form data
      const validation = addPlaceSchema.safeParse(formData);
      
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        setLoadingForm(false);
        return;
      }

      if (!user) {
        setError('You must be logged in to add a place');
        setLoadingForm(false);
        return;
      }

      // Check if location is selected
      if (!selectedLocation) {
        setError('Please select a location on the map by clicking on it');
        setLoadingForm(false);
        return;
      }

      // Convert form data to Place object
      const visitDate = new Date(validation.data.visitDate);
      
      const placeInput = {
        title: validation.data.name,
        description: validation.data.notes || '',
        location: selectedLocation, // Use selected location from map
        address: {
          formatted: `${validation.data.city}, ${validation.data.country}`,
          city: validation.data.city,
          country: validation.data.country,
        },
        visitDate,
        photos: [],
        isPublic: false,
        tags: [],
      };

      // Save to Firestore
      const place = await databaseService.createPlace(placeInput, user.uid);
      console.log('✅ Place created with location:', place);
      
      // Show success and redirect
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error adding place:', err);
      setError(err instanceof Error ? err.message : 'Failed to add place');
      setLoadingForm(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: AddPlaceFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-slate-900">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-5">
            <nav className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  T
                </div>
                <span className="text-xl font-semibold text-white">TripNoute</span>
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/map" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Map
                </Link>
                <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Dashboard
                </Link>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-16 max-w-2xl">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">Add New Place</h1>
            <p className="text-slate-300 text-lg">Document your travel memories</p>
          </div>

          <div className="p-10 rounded-2xl bg-white/10 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  ✓ Place added successfully! Redirecting...
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Place Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Place Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Eiffel Tower"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-300 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., France"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Paris"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Visit Date */}
              <div>
                <label htmlFor="visitDate" className="block text-sm font-medium text-slate-300 mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  id="visitDate"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Share your experience, tips, or memories..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Map for Location Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location * (Click on the map to select)
                </label>
                <div 
                  ref={mapRef}
                  className="w-full h-[400px] rounded-lg bg-slate-800 border border-white/10"
                  style={{ minHeight: '400px' }}
                />
                {selectedLocation && (
                  <p className="text-xs text-slate-400 mt-2">
                    📍 Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
                {!selectedLocation && mapLoaded && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Please click on the map to select a location
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loadingForm}
                  className="flex-1 py-4 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition-all"
                >
                  {loadingForm ? 'Adding Place...' : 'Add Place'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-all text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
