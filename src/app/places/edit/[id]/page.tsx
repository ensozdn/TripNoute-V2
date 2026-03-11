'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { databaseService } from '@/lib/database';
import { addPlaceSchema } from '@/utils/validators';
import { usePhotoManagement } from '@/hooks/usePhotoManagement';
import { Photo } from '@/types/models/Photo';
import ProtectedRoute from '@/components/ProtectedRoute';
import StepLocation, { SelectedLocation } from '../../add/_components/StepLocation';
import StepDetails, { PlaceDetails } from '../../add/_components/StepDetails';
import WizardProgress from '../../add/_components/WizardProgress';
import { ImageUploader, PhotoGallery } from '@/components/place';

type WizardStep = 1 | 2 | 3;

export default function EditPlacePage() {
  const router  = useRouter();
  const params  = useParams();
  const placeId = params.id as string;
  const { user } = useAuth();

  const [loading,       setLoading]       = useState(true);
  const [step,          setStep]          = useState<WizardStep>(2);
  const [error,         setError]         = useState('');
  const [saving,        setSaving]        = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photos,        setPhotos]        = useState<Photo[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [details, setDetails] = useState<PlaceDetails>({
    name: '', country: '', city: '', visitDate: '', notes: '',
  });

  const { uploading, uploadProgress, uploadPhotos, deletePhoto, updatePhotoDescription } =
    usePhotoManagement({
      placeId,
      userId: user?.uid ?? '',
      onError: (err) => setError(err.message),
    });

  useEffect(() => {
    const load = async () => {
      if (!user || !placeId) return;
      try {
        const place = await databaseService.getPlaceById(placeId);
        if (!place)                    { setError('Place not found'); return; }
        if (place.userId !== user.uid) { setError('Permission denied'); return; }

        const visitDate = new Date(place.visitDate.seconds * 1000)
          .toISOString().split('T')[0];

        setDetails({
          name:      place.title,
          country:   place.address.country ?? '',
          city:      place.address.city    ?? '',
          visitDate,
          notes:     place.description    ?? '',
        });
        if (place.location?.lat && place.location?.lng) {
          setSelectedLocation(place.location);
        }
        setPhotos(place.photos ?? []);
      } catch {
        setError('Failed to load place');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, placeId]);

  const handleSave = async () => {
    if (!user || !selectedLocation) return;
    setError('');

    const result = addPlaceSchema.safeParse(details);
    if (!result.success) { setError(result.error.issues[0].message); return; }

    setSaving(true);
    try {
      await databaseService.updatePlace({
        id: placeId,
        title:       details.name.trim(),
        description: details.notes || undefined,
        location:    selectedLocation,
        address: {
          country:   details.country,
          city:      details.city,
          formatted: `${details.city}, ${details.country}`,
        },
        visitDate: new Date(details.visitDate),
      });

      if (selectedFiles.length > 0) {
        const uploaded = await uploadPhotos(selectedFiles);
        setPhotos(prev => [...prev, ...uploaded]);
        setSelectedFiles([]);
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch {
      setError('Failed to update place. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    try { await deletePhoto(photo); setPhotos(prev => prev.filter(p => p.id !== photo.id)); }
    catch { /* ignore */ }
  };

  const handleUpdateDescription = async (photoId: string, description: string) => {
    try {
      await updatePhotoDescription(photoId, description);
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description } : p));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !details.name) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4 px-6">
          <p className="text-slate-500 text-center">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-semibold text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-white">
        <WizardProgress
          currentStep={step}
          onBack={() => setStep(s => (s > 1 ? (s - 1) as WizardStep : s))}
          onClose={() => router.push('/dashboard')}
        />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepLocation
              key="step-1"
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && selectedLocation && (
            <StepDetails
              key="step-2"
              details={details}
              selectedLocation={selectedLocation}
              onChange={setDetails}
              onContinue={() => { setError(''); setStep(3); }}
              error={error}
            />
          )}

          {step === 2 && !selectedLocation && (
            <motion.div
              key="no-loc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 pt-24"
            >
              <p className="text-slate-400 text-sm text-center">No location set — pick one first.</p>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-2xl bg-blue-500 text-white font-semibold text-sm"
              >
                Pick Location
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 flex flex-col bg-white overflow-y-auto"
            >
              <div className="h-[88px] shrink-0" />

              <div className="flex-1 px-5 pb-36 pt-6 space-y-6">
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium"
                    >
                      ✓ Place updated! Redirecting…
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Current Photos ({photos.length})
                    </p>
                    <PhotoGallery
                      photos={photos}
                      onDelete={handleDeletePhoto}
                      onUpdateDescription={handleUpdateDescription}
                      disabled={saving || uploading}
                      columns={3}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Photos</p>
                  <ImageUploader
                    onFilesSelected={setSelectedFiles}
                    maxFiles={10}
                    maxSizeInMB={10}
                    disabled={saving}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-xs text-slate-400 text-center">
                      {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-10 pt-6 bg-gradient-to-t from-white via-white/95 to-transparent space-y-3">
                <motion.button
                  onClick={handleSave}
                  disabled={saving || uploading || success}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all
                    disabled:bg-black/6 disabled:text-slate-300 disabled:cursor-not-allowed
                    bg-blue-500 active:bg-blue-700 shadow-xl shadow-blue-500/25"
                >
                  {uploading ? `Uploading… ${Math.round(uploadProgress)}%` : saving ? 'Saving…' : 'Save Changes ✓'}
                </motion.button>
                {!saving && !uploading && !success && selectedFiles.length === 0 && (
                  <button
                    onClick={handleSave}
                    className="w-full py-3 text-sm text-slate-400"
                  >
                    Save without changing photos
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
