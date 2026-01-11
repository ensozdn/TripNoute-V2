/**
 * TripNoute v2 - Edit Place Page
 * 
 * Form for editing existing travel places.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { googleMapsService } from '@/lib/googleMaps';
import { addPlaceSchema } from '@/utils/validators';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;
  const { user } = useAuth();
  
  const [loadingPlace, setLoadingPlace] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    visitDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load place data
  useEffect(() => {
    const loadPlace = async () => {
      if (!user || !placeId) return;

      try {
        const place = await databaseService.getPlaceById(placeId);
        
        if (!place) {
          setError('Place not found');
          return;
        }

        // Check if user owns this place
        if (place.userId !== user.uid) {
          setError('You do not have permission to edit this place');
          return;
        }

        // Convert Firestore timestamp to date string
        const visitDate = new Date(place.visitDate.seconds * 1000)
          .toISOString()
          .split('T')[0];

        setFormData({
          name: place.title,
          country: place.address.country || '',
          city: place.address.city || '',
          visitDate,
          notes: place.description || '',
        });
      } catch (err) {
        console.error('Error loading place:', err);
        setError('Failed to load place');
      } finally {
        setLoadingPlace(false);
      }
    };

    loadPlace();
  }, [user, placeId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError('');

    // Validate form
    const result = addPlaceSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user) return;

    setLoadingForm(true);

    try {
      // Geocode the address to get updated coordinates
      let location;
      try {
        const address = `${formData.city}, ${formData.country}`;
        const geocodeResult = await googleMapsService.geocodeAddress(address);
        location = { lat: geocodeResult.lat, lng: geocodeResult.lng };
      } catch (geocodeError) {
        console.warn('Geocoding failed during update:', geocodeError);
        // Don't update location if geocoding fails
      }

      await databaseService.updatePlace({
        id: placeId,
        title: formData.name,
        description: formData.notes || undefined,
        location,
        address: {
          country: formData.country,
          city: formData.city,
          formatted: `${formData.city}, ${formData.country}`,
        },
        visitDate: new Date(formData.visitDate),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating place:', err);
      setError('Failed to update place. Please try again.');
      setLoadingForm(false);
    }
  };

  if (loadingPlace) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-xl text-white">Loading place...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !loadingPlace) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen relative bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <header className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-5">
              <nav className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    T
                  </div>
                  <span className="text-xl font-semibold text-white">TripNoute</span>
                </Link>
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-6 py-16">
            <div className="max-w-2xl mx-auto">
              <div className="p-10 rounded-2xl bg-white/10 border border-white/20 text-center">
                <span className="text-6xl mb-4 block">❌</span>
                <h1 className="text-3xl font-bold text-white mb-4">Error</h1>
                <p className="text-slate-300 mb-8">{error}</p>
                <Link
                  href="/dashboard"
                  className="inline-block py-3 px-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
      </ProtectedRoute>
    );
  }

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
              <Link href="/dashboard" className="flex items-center gap-3">
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
        <main className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Page Title */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-3">Edit Place</h1>
              <p className="text-slate-300">Update your travel memory</p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-8 p-6 rounded-xl bg-green-500/20 border border-green-500/50 text-center">
                <p className="text-green-400 font-medium">✓ Place updated successfully! Redirecting...</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/10 border border-white/20">
              {/* Place Name */}
              <div className="mb-6">
                <label htmlFor="name" className="block text-white font-medium mb-2">
                  Place Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Eiffel Tower"
                  disabled={loadingForm}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Country */}
              <div className="mb-6">
                <label htmlFor="country" className="block text-white font-medium mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., France"
                  disabled={loadingForm}
                />
                {errors.country && (
                  <p className="mt-2 text-sm text-red-400">{errors.country}</p>
                )}
              </div>

              {/* City */}
              <div className="mb-6">
                <label htmlFor="city" className="block text-white font-medium mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Paris"
                  disabled={loadingForm}
                />
                {errors.city && (
                  <p className="mt-2 text-sm text-red-400">{errors.city}</p>
                )}
              </div>

              {/* Visit Date */}
              <div className="mb-6">
                <label htmlFor="visitDate" className="block text-white font-medium mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  id="visitDate"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loadingForm}
                />
                {errors.visitDate && (
                  <p className="mt-2 text-sm text-red-400">{errors.visitDate}</p>
                )}
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label htmlFor="notes" className="block text-white font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Share your memories and experiences..."
                  disabled={loadingForm}
                />
                {errors.notes && (
                  <p className="mt-2 text-sm text-red-400">{errors.notes}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loadingForm}
                className="w-full py-4 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingForm ? 'Updating...' : 'Update Place'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
