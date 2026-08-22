import React, { useEffect, useState } from 'react';
import { Stop, City, Activity } from '../../types';
import { activitiesApi } from '../../api/activities';
import { ActivityCard } from '../search/ActivityCard';
import { Button } from '../common/Button';
import { ChevronDown, ChevronUp, MapPin, Calendar, Trash2, Sparkles } from 'lucide-react';

interface StopCardProps {
  stop: Stop;
  index: number;
  totalStops: number;
  cities: City[];
  onUpdate: (stopId: number, updates: Partial<Stop>) => void;
  onRemove: (stopId: number) => void;
  onReorder: (stopId: number, direction: 'up' | 'down') => void;
  onAssignActivity: (stopId: number, activity: Activity) => void;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  index,
  totalStops,
  cities,
  onUpdate,
  onRemove,
  onReorder,
  onAssignActivity,
}) => {
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const cityName =
    cities.find((c) => c.id === stop.city_id)?.name ||
    stop.city?.name ||
    `City #${stop.city_id}`;

  useEffect(() => {
    if (!showActivities) return;
    const loadActivities = async () => {
      setLoadingActivities(true);
      try {
        const data = await activitiesApi.getActivities({ city_id: stop.city_id, limit: 12 });
        setActivities(data);
      } catch (err) {
        console.error('Failed to load stop activities:', err);
      } finally {
        setLoadingActivities(false);
      }
    };
    loadActivities();
  }, [showActivities, stop.city_id]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
            Stop {index + 1}
          </p>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
            <MapPin className="h-4 w-4 text-brand-500" />
            {cityName}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onReorder(stop.id, 'up')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move stop up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={index === totalStops - 1}
            onClick={() => onReorder(stop.id, 'down')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move stop down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(stop.id)}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            aria-label="Remove stop"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            City
          </label>
          <select
            value={stop.city_id}
            onChange={(e) => onUpdate(stop.id, { city_id: Number(e.target.value) })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Arrival
          </label>
          <input
            type="date"
            value={stop.arrival_date || ''}
            onChange={(e) => onUpdate(stop.id, { arrival_date: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Departure
          </label>
          <input
            type="date"
            value={stop.departure_date || ''}
            min={stop.arrival_date || undefined}
            onChange={(e) => onUpdate(stop.id, { departure_date: e.target.value })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
          onClick={() => setShowActivities((prev) => !prev)}
        >
          {showActivities ? 'Hide Activities' : 'Assign Activities to This Stop'}
        </Button>

        {showActivities && (
          <div className="mt-4">
            {loadingActivities ? (
              <p className="text-xs text-slate-500">Loading activities...</p>
            ) : activities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onAdd={() => onAssignActivity(stop.id, activity)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No activities found for this city.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
