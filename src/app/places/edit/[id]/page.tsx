'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { addPlaceSchema } from '@/utils/validators';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { Photo } from '@/types/models/Photo';
import ProtectedRoute from '@/components/ProtectedRoute';
import MapboxLocationPicker from '@/components/MapboxLocationPicker';
import { ImageUploader, PhotoGallery } from '@/components/place';

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;
  const { user } = useAuth();

  const [loadingPlace, setLoadingPlace] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    visitDate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    uploading,
    uploadProgress,
    uploadPhotos,
    deletePhoto,
    updatePhotoDescription,
  } = usePhotoManagement({
    placeId,
    userId: user?.uid || '',
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);

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

  useEffect(() => {
    const loadPlace = async () => {
      if (!user || !placeId) return;

      try {
        const place = await databaseService.getPlaceById(placeId);

        if (!place) {
          setError('Place not found');
          return;
        }

        if (place.userId !== user.uid) {
          setError('You do not have permission to edit this place');
          return;
        }

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

        if (place.location?.lat && place.location?.lng) {
          setSelectedLocation(place.location);
        }

        setPhotos(place.photos || []);
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const uploadedPhotos = await uploadPhotos(selectedFiles);
      setPhotos(prev => [...prev, ...uploadedPhotos]);
      setSelectedFiles([]);
    } catch (err) {
      console.error('Failed to upload photos:', err);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    try {
      await deletePhoto(photo);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  const handleUpdateDescription = async (photoId: string, description: string) => {
    try {
      await updatePhotoDescription(photoId, description);
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, description } : p
      ));
    } catch (err) {
      console.error('Failed to update description:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError('');

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

      if (!selectedLocation) {
        setError('Please select a location on the map');
        setLoadingForm(false);
        return;
      }

      await databaseService.updatePlace({
        id: placeId,
        title: formData.name,
        description: formData.notes || undefined,
        location: selectedLocation,
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
              </nav>
            </div>
          </header>

          <main className="container mx-auto px-6 py-16">
            <div className="max-w-2xl mx-auto">
              <div className="p-10 rounded-2xl bg-white/10 border border-white/20 text-center">
                <span className="text-6xl mb-4 block"></span>
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
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/20 via-transparent to-transparent"></div>

      {}
      <div className="relative z-10">
        {}
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

        {}
        <main className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto">
            {}
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-3">Edit Place</h1>
              <p className="text-slate-300">Update your travel memory</p>
            </div>

            {}
            {success && (
              <div className="mb-8 p-6 rounded-xl bg-green-500/20 border border-green-500/50 text-center">
                <p className="text-green-400 font-medium"> Place updated successfully! Redirecting...</p>
              </div>
            )}

            {}
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/10 border border-white/20">
              {}
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

              {}
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

              {}
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

              {}
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

              {}
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

              {}
              {photos.length > 0 && (
                <div className="mb-8">
                  <label className="block text-white font-medium mb-4">
                    Photos ({photos.length})
                  </label>
                  <PhotoGallery
                    photos={photos}
                    onDelete={handleDeletePhoto}
                    onUpdateDescription={handleUpdateDescription}
                    disabled={loadingForm || uploading}
                    columns={3}
                  />
                </div>
              )}

              {}
              <div className="mb-8">
                <label className="block text-white font-medium mb-4">
                  Add Photos
                </label>
                <ImageUploader
                  onFilesSelected={setSelectedFiles}
                  maxFiles={10}
                  maxSizeInMB={10}
                  disabled={loadingForm}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                    </p>
                    <button
                      type="button"
                      onClick={handleUploadPhotos}
                      disabled={uploading || loadingForm}
                      className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-medium transition-all"
                    >
                      {uploading ? 'Uploading...' : 'Upload Photos'}
                    </button>
                  </div>
                )}
              </div>

              {}
              <div className="mb-8">
                <label className="block text-white font-medium mb-2">
                  Location * (Search or click to update)
                </label>
                <MapboxLocationPicker
                  initialLocation={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
                  onLocationSelect={handleLocationSelect}
                />
                {selectedLocation && (
                  <p className="text-xs text-slate-400 mt-2">
                    Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {}
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
