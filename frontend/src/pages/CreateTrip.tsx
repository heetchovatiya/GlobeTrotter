import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { City, Activity } from '../types';
import { citiesApi } from '../api/cities';
import { activitiesApi } from '../api/activities';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { sectionsApi } from '../api/sections';
import { uploadsApi } from '../api/uploads';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ActivityCard } from '../components/search/ActivityCard';
import { useUIStore } from '../store/uiStore';
import { validateTripDates, isValidHttpUrl } from '../utils/validation';
import { Calendar, MapPin, Sparkles, ArrowRight, Image as ImageIcon, Upload, X } from 'lucide-react';

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<Activity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const cityList = await citiesApi.getCities();
        setCities(cityList);
        if (cityList.length > 0) {
          const initialCityId = selectedCityId || cityList[0].id;
          setSelectedCityId(initialCityId);
          const acts = await activitiesApi.getActivities({ city_id: initialCityId });
          setSuggestedActivities(acts);
        }
      } catch (err) {
        console.error('Failed to load initial cities:', err);
      }
    };
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCityId) return;
    const loadActivities = async () => {
      try {
        const acts = await activitiesApi.getActivities({ city_id: selectedCityId });
        setSuggestedActivities(acts);
      } catch (err) {
        console.error('Failed to load city activities:', err);
      }
    };
    loadActivities();
  }, [selectedCityId]);

  const handleCityChange = (cityId: number) => {
    setSelectedCityId(cityId);
    const chosenCity = cities.find((c) => c.id === cityId);
    if (chosenCity && !coverFile) {
      setCoverPhotoUrl(chosenCity.image_url);
      setCoverPreview(chosenCity.image_url);
    }
    setSelectedActivityIds([]);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Cover photo must be 5 MB or smaller.');
      return;
    }

    setCoverFile(file);
    setCoverPhotoUrl('');
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearCoverPhoto = () => {
    setCoverFile(null);
    setCoverPhotoUrl('');
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleActivitySelection = (activity: Activity) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activity.id) ? prev.filter((id) => id !== activity.id) : [...prev, activity.id]
    );
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Please provide a trip name.');
      return;
    }

    const dateError = validateTripDates(startDate, endDate);
    if (dateError) {
      showToast('error', dateError);
      return;
    }

    if (coverPhotoUrl && !coverFile && !isValidHttpUrl(coverPhotoUrl)) {
      showToast('error', 'Cover photo URL must be a valid http or https link.');
      return;
    }

    if (!selectedCityId) {
      showToast('error', 'Please select a destination city.');
      return;
    }

    setIsLoading(true);
    try {
      let resolvedCoverUrl = coverPhotoUrl.trim() || undefined;
      if (coverFile) {
        resolvedCoverUrl = await uploadsApi.uploadCoverPhoto(coverFile);
      }

      const createdTrip = await tripsApi.createTrip({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || undefined,
        cover_photo_url: resolvedCoverUrl,
      });

      const stop = await stopsApi.createStop(createdTrip.id, {
        city_id: selectedCityId,
        arrival_date: startDate,
        departure_date: endDate,
        order_index: 1,
      });

      if (selectedActivityIds.length > 0) {
        const selectedActs = suggestedActivities.filter((a) => selectedActivityIds.includes(a.id));
        for (let i = 0; i < selectedActs.length; i++) {
          const act = selectedActs[i];
          await sectionsApi.createSection(createdTrip.id, stop.id, {
            title: `Section ${i + 1}: ${act.name}`,
            type: 'activity',
            date_range_start: startDate,
            date_range_end: startDate,
            budget: act.cost || 50,
            notes: act.description,
            order_index: i + 1,
          });
        }
      } else {
        await sectionsApi.createSection(createdTrip.id, stop.id, {
          title: 'Section 1: Inbound Arrival & Welcome Tour',
          type: 'travel',
          date_range_start: startDate,
          date_range_end: startDate,
          budget: 150,
          notes: 'Flight arrival and check-in.',
          order_index: 1,
        });
      }

      showToast('success', 'Trip saved! Opening itinerary builder.');
      navigate(`/trips/${createdTrip.id}/build`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create trip.';
      showToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create a New Trip
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide trip details to begin building your personalized travel plan.
        </p>
      </div>

      <form onSubmit={handleCreateTrip} className="space-y-8">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Trip Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer in Southern Italy"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Primary Destination / City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedCityId}
                    onChange={(e) => handleCityChange(Number(e.target.value))}
                    className="block w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  required
                  leftIcon={<Calendar className="h-4 w-4" />}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  required
                  leftIcon={<Calendar className="h-4 w-4" />}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 flex flex-col">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trip Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline your journey highlights, travel companions, or bucket list goals..."
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Cover Photo <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>

                {coverPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={coverPreview} alt="Cover preview" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={clearCoverPhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-rose-600 shadow-sm"
                      aria-label="Remove cover photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 hover:border-brand-400 hover:bg-brand-50/40 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="font-semibold">Upload cover photo</span>
                    <span className="text-xs">JPEG, PNG, WebP, or GIF up to 5 MB</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />

                {!coverFile && (
                  <Input
                    label="Or paste image URL"
                    leftIcon={<ImageIcon className="h-4 w-4" />}
                    value={coverPhotoUrl}
                    onChange={(e) => {
                      setCoverPhotoUrl(e.target.value);
                      setCoverPreview(e.target.value || null);
                    }}
                    placeholder="https://..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span>Suggestions for Places to Visit & Activities</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any activity to automatically generate a dedicated itinerary section block.
              </p>
            </div>
            <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              {selectedActivityIds.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {suggestedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onAdd={toggleActivitySelection}
                isAdded={selectedActivityIds.includes(activity.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={() => navigate('/trips')}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="shadow-md shadow-brand-500/25"
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
