
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  GripVertical, 
  MapPin, 
  Trash2, 
  Plus,
  Plane,
  Car,
  Bus,
  Train,
  Ship,
  Footprints,
  Bike,
  X,
  Check,
} from 'lucide-react';
import { TripStop, TransportMode, TRIP_COLORS } from '@/types/trip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MultiStopRoutePlannerProps {
  onSave: (data: {
    name: string;
    description: string;
    color: string;
    stops: Omit<TripStop, 'id'>[];
  }) => Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

const TRANSPORT_ICONS: Record<TransportMode, React.ReactNode> = {
  flight: <Plane className="w-5 h-5" />,
  car: <Car className="w-5 h-5" />,
  bus: <Bus className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  ship: <Ship className="w-5 h-5" />,
  walk: <Footprints className="w-5 h-5" />,
  walking: <Footprints className="w-5 h-5" />,
  bike: <Bike className="w-5 h-5" />,
};

const TRANSPORT_LABELS: Record<TransportMode, string> = {
  flight: 'Flight',
  car: 'Car',
  bus: 'Bus',
  train: 'Train',
  ship: 'Ship',
  walk: 'Walk',
  walking: 'Walking',
  bike: 'Bike',
};

export default function MultiStopRoutePlanner({
  onSave,
  onCancel,
  onClose,
}: MultiStopRoutePlannerProps) {
  const [tripName, setTripName] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TRIP_COLORS[0]);
  const [stops, setStops] = useState<Omit<TripStop, 'id'>[]>([]);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const handleAddStop = useCallback((location: { lat: number; lng: number }, title: string) => {
    const newStop: Omit<TripStop, 'id'> = {
      order: stops.length,
      location,
      title,
      address: { formatted: title },
      description: '',
      transportToNext: stops.length > 0 ? 'flight' : undefined,
    };

    setStops(prev => [...prev, newStop]);
  }, [stops]);

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      order: i,
    })));
  };

  const handleTransportChange = (index: number, transport: TransportMode) => {
    setStops(prev => prev.map((stop, i) => 
      i === index ? { ...stop, transportToNext: transport } : stop
    ));
  };

  const handleStopUpdate = (index: number, updates: Partial<Omit<TripStop, 'id'>>) => {
    setStops(prev => prev.map((stop, i) => 
      i === index ? { ...stop, ...updates } : stop
    ));
  };

  const handleReorder = (newOrder: Omit<TripStop, 'id'>[]) => {
    setStops(newOrder.map((stop, i) => ({ ...stop, order: i })));
  };

  const handleSave = async () => {
    if (!tripName.trim()) {
      alert('Please enter a trip name');
      return;
    }

    if (stops.length < 2) {
      alert('Please add at least 2 stops');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: tripName,
        description: tripDescription,
        color: selectedColor,
        stops,
      });
    } catch (error) {
      console.error('Failed to save trip:', error);
      alert('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__addTripStop = handleAddStop;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__addTripStop;
      }
    };
  }, [handleAddStop]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      >
        {}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-slate-900">Create Trip Route</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500">
            Click on the map to add stops, then connect them with transport modes
          </p>
        </div>

        {}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trip Name *
              </label>
              <Input
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Europe Summer 2025"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description (Optional)
              </label>
              <Textarea
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
                placeholder="What's this trip about?"
                rows={3}
                className="w-full"
              />
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Route Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {TRIP_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color 
                        ? 'ring-4 ring-offset-2 ring-slate-400 scale-110' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <Check className="w-5 h-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Stops ({stops.length})
              </label>
              <Button
                onClick={() => {
                  alert('Click on the map to add a stop!');
                }}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Stop
              </Button>
            </div>

            {stops.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-2">No stops yet</p>
                <p className="text-sm text-slate-400">Click "Add Stop" and then click on the map</p>
              </div>
            ) : (
              <Reorder.Group axis="y" values={stops} onReorder={handleReorder} className="space-y-3">
                {stops.map((stop, index) => (
                  <Reorder.Item key={stop.order} value={stop}>
                    <motion.div
                      layout
                      className="bg-slate-50 rounded-xl p-4 space-y-3"
                    >
                      {}
                      <div className="flex items-start gap-3">
                        <button className="cursor-grab active:cursor-grabbing mt-1">
                          <GripVertical className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <Input
                              value={stop.title}
                              onChange={(e) => handleStopUpdate(index, { title: e.target.value })}
                              placeholder="Stop name"
                              className="font-medium"
                            />
                          </div>
                          <p className="text-xs text-slate-500 ml-8">
                            {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveStop(index)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {}
                      {index < stops.length - 1 && (
                        <div className="ml-8 pl-4 border-l-2 border-slate-200">
                          <p className="text-xs text-slate-500 mb-2">Transport to next stop:</p>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(TRANSPORT_ICONS).map(([mode, icon]) => (
                              <button
                                key={mode}
                                onClick={() => handleTransportChange(index, mode as TransportMode)}
                                className={`p-2 rounded-lg border-2 transition-all ${
                                  stop.transportToNext === mode
                                    ? 'border-slate-800 bg-slate-800 text-white'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                                title={TRANSPORT_LABELS[mode as TransportMode]}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
            disabled={saving || stops.length < 2 || !tripName.trim()}
          >
            {saving ? 'Saving...' : `Create Trip (${stops.length} stops)`}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
