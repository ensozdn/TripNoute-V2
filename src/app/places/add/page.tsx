/**
 * TripNoute v2 - Add Place Page
 * 
 * Form for adding a new place to the user's collection.
 * Hibrit Model: Mapbox (görselleştirme) + Google Places (arama/geocoding)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { addPlaceSchema } from '@/utils/validators';
import { databaseService } from '@/lib/database';
import { storageService } from '@/services/firebase/FirebaseStorageService';
import { z } from 'zod';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import MapboxLocationPicker from '@/components/MapboxLocationPicker';
import { ImageUploader } from '@/components/place';

type AddPlaceFormData = z.infer<typeof addPlaceSchema>;

export default function AddPlacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<AddPlaceFormData>({
    name: '',
    country: '',
    city: '',
    visitDate: '',
    notes: '',
  });

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);
    
    // Try to extract city and country from address
    if (location.address) {
      const addressParts = location.address.split(',').map(part => part.trim());
      if (addressParts.length >= 2) {
        const country = addressParts[addressParts.length - 1];
        const city = addressParts[addressParts.length - 2];
        
        setFormData(prev => ({
          ...prev,
          country: country || prev.country,
          city: city || prev.city,
        }));
      }
    }
  };

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
      
      // Upload photos if any selected
      if (selectedFiles.length > 0) {
        setUploading(true);
        try {
          const uploadPromises = selectedFiles.map((file, index) =>
            storageService.uploadPhoto(file, user.uid, place.id, {}, (progress) => {
              const fileProgress = progress.percentage / selectedFiles.length;
              const overallProgress = (index / selectedFiles.length) * 100 + fileProgress;
              setUploadProgress(overallProgress);
            }).then((photo) => {
              // Add photo to place
              return databaseService.addPhotoToPlace(place.id, photo);
            })
          );
          
          await Promise.all(uploadPromises);
          setUploading(false);
        } catch (photoError) {
          console.error('Failed to upload photos:', photoError);
          setUploading(false);
          // Don't block place creation if photo upload fails
          setError('Place created but some photos failed to upload');
        }
      }
      
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
                <Image 
                  src="/tripnoute-logo.png" 
                  alt="TripNoute Logo" 
                  width={40} 
                  height={40}
                  className="rounded-xl"
                />
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

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Photos
                </label>
                <ImageUploader
                  onFilesSelected={setSelectedFiles}
                  maxFiles={10}
                  maxSizeInMB={10}
                  disabled={loadingForm || uploading}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Map for Location Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location * (Search or click on the map)
                </label>
                <MapboxLocationPicker
                  initialLocation={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
                  onLocationSelect={handleLocationSelect}
                />
                {selectedLocation && (
                  <p className="text-xs text-slate-400 mt-2">
                    Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
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
