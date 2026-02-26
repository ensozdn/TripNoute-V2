'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addPlaceSchema } from '@/utils/validators';
import { databaseService } from '@/lib/database';
import { storageService } from '@/services/firebase/FirebaseStorageService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AnimatePresence } from 'framer-motion';
import WizardProgress from './_components/WizardProgress';
import StepLocation from './_components/StepLocation';
import StepDetails from './_components/StepDetails';
import StepPhotos from './_components/StepPhotos';
import type { SelectedLocation } from './_components/StepLocation';
import type { PlaceDetails } from './_components/StepDetails';

type WizardStep = 1 | 2 | 3;

export default function AddPlacePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [details, setDetails] = useState<PlaceDetails>({
    name: '',
    country: '',
    city: '',
    visitDate: '',
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleLocationSelect = (loc: SelectedLocation) => {
    setSelectedLocation(loc);
    if (loc.address) {
      const parts = loc.address.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        setDetails(prev => ({
          ...prev,
          country: prev.country || parts[parts.length - 1],
          city: prev.city || parts[parts.length - 2],
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!user || !selectedLocation) return;
    setError('');

    const validation = addPlaceSchema.safeParse({
      name: details.name,
      country: details.country,
      city: details.city,
      visitDate: details.visitDate,
      notes: details.notes,
    });

    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const place = await databaseService.createPlace({
        title: validation.data.name,
        description: validation.data.notes || '',
        location: selectedLocation,
        address: {
          formatted: `${validation.data.city}, ${validation.data.country}`,
          city: validation.data.city,
          country: validation.data.country,
        },
        visitDate: new Date(validation.data.visitDate),
        photos: [],
        isPublic: false,
        tags: [],
        order: Date.now(),
      }, user.uid);

      if (selectedFiles.length > 0) {
        setUploading(true);
        setUploadProgress(0);

        const fileProgressMap = new Map<number, number>();
        const uploadPromises = selectedFiles.map((file, index) =>
          storageService.uploadPhoto(file, user.uid, place.id, {}, (progress) => {
            fileProgressMap.set(index, progress.percentage);
            const total = Array.from(fileProgressMap.values()).reduce((a, b) => a + b, 0);
            setUploadProgress(Math.min(total / selectedFiles.length, 99));
          }).then(photo => databaseService.addPhotoToPlace(place.id, photo))
        );

        const results = await Promise.allSettled(uploadPromises);
        setUploadProgress(100);
        setUploading(false);

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          setError(`Place saved but ${failures.length} photo(s) failed to upload.`);
          setTimeout(() => router.push('/dashboard'), 2500);
          return;
        }
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setIsSaving(false);
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-slate-900">
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
              onLocationSelect={handleLocationSelect}
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
          {step === 3 && (
            <StepPhotos
              key="step-3"
              selectedFiles={selectedFiles}
              onFilesSelected={setSelectedFiles}
              onSave={handleSave}
              isSaving={isSaving}
              uploading={uploading}
              uploadProgress={uploadProgress}
              error={error}
            />
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
