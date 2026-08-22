import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { City, Activity } from '../types';
import { citiesApi } from '../api/cities';
import { activitiesApi } from '../api/activities';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { sectionsApi } from '../api/sections';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ActivityCard } from '../components/search/ActivityCard';
import { useUIStore } from '../store/uiStore';
import { Calendar, MapPin, Sparkles, ArrowRight, Image as ImageIcon } from 'lucide-react';

export const CreateTrip: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [name, setName] = useState('Autumn Japanese Splendor & Alps');
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [startDate, setStartDate] = useState('2026-09-10');
  const [endDate, setEndDate] = useState('2026-09-22');
  const [description, setDescription] = useState(
    'A multi-country adventure exploring historic Kyoto shrines and Swiss mountain summits.'
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80'
  );

  const [cities, setCities] = useState<City[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<Activity[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCitiesAndSuggestions = async () => {
      try {
        const cityList = await citiesApi.getCities();
        setCities(cityList);
        if (cityList.length > 0) {
          const acts = await activitiesApi.getActivities({ city_id: selectedCityId });
          setSuggestedActivities(acts);
        }
      } catch (err) {
        console.error('Failed to load initial cities:', err);
      }
    };
    loadCitiesAndSuggestions();
  }, [selectedCityId]);

  const handleCityChange = async (cityId: number) => {
    setSelectedCityId(cityId);
    const chosenCity = cities.find((c) => c.id === cityId);
    if (chosenCity) {
      setCoverPhotoUrl(chosenCity.image_url);
    }
    try {
      const acts = await activitiesApi.getActivities({ city_id: cityId });
      setSuggestedActivities(acts);
    } catch (err) {
      console.error('Failed to load city activities:', err);
    }
  };

  const toggleActivitySelection = (activity: Activity) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activity.id) ? prev.filter((id) => id !== activity.id) : [...prev, activity.id]
    );
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Please provide a trip title.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Trip
      const createdTrip = await tripsApi.createTrip({
        name,
        start_date: startDate,
        end_date: endDate,
        description,
        cover_photo_url: coverPhotoUrl,
        is_public: true,
      });

      // 2. Create Stop for initial destination city
      const stop = await stopsApi.createStop(createdTrip.id, {
        city_id: selectedCityId,
        arrival_date: startDate,
        departure_date: endDate,
        order_index: 1,
      });

      // 3. Create initial itinerary sections based on selected activities
      if (selectedActivityIds.length > 0) {
        const selectedActs = suggestedActivities.filter((a) => selectedActivityIds.includes(a.id));
        for (let i = 0; i < selectedActs.length; i++) {
          const act = selectedActs[i];
          await sectionsApi.createSection(createdTrip.id, stop.id, {
            title: `Section ${i + 1}: ${act.name}`,
            type: act.type === 'adventure' ? 'activity' : act.type === 'food' ? 'activity' : 'activity',
            date_range_start: startDate,
            date_range_end: startDate,
            budget: act.cost || 50,
            notes: act.description,
            order_index: i + 1,
          });
        }
      } else {
        // Default seed section
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

      showToast('success', 'Trip created! Proceeding to build itinerary sections.');
      // Flow 1: Redirect immediately to /trips/:id/build
      navigate(`/trips/${createdTrip.id}/build`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create trip.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create a New Trip
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Specify your destination, trip duration, and pre-select must-see activities to seed your itinerary sections.
        </p>
      </div>

      <form onSubmit={handleCreateTrip} className="space-y-8">
        {/* Main Details Card */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Trip Title"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer in Southern Italy, Tokyo to Kyoto"
              />

              {/* Destination selector */}
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

              {/* Dates */}
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
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Description & Cover */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Trip Description / Objectives
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline your journey highlights, travel companions, or bucket list goals..."
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <Input
                  label="Cover Photo URL"
                  leftIcon={<ImageIcon className="h-4 w-4" />}
                  value={coverPhotoUrl}
                  onChange={(e) => setCoverPhotoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Activities Pattern Grid (from Wireframe Screen 4) */}
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

        {/* Continue Action */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/trips')}
          >
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
            Save & Build Itinerary
          </Button>
        </div>
      </form>
    </div>
  );
};

