import React from 'react';
import { Sparkles } from 'lucide-react';
import { Activity, City } from '../../types';
import { ActivityCard } from '../search/ActivityCard';
import { Skeleton } from '../common/Skeleton';

interface WizardStepActivitiesProps {
  cities: City[];
  cityIds: number[];
  cityDays: Record<number, number>;
  activitiesByCity: Record<number, Activity[]>;
  selectedIds: number[];
  onToggle: (activity: Activity) => void;
  loading?: boolean;
}

export const WizardStepActivities: React.FC<WizardStepActivitiesProps> = ({
  cities,
  cityIds,
  cityDays,
  activitiesByCity,
  selectedIds,
  onToggle,
  loading = false,
}) => {
  const routeCities = cityIds
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean) as City[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            What do you want to do?
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pick activities for each city. We&apos;ll spread them across your daily schedule based on
            duration — about 7 hours of sightseeing per day.
          </p>
        </div>
        <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full shrink-0">
          {selectedIds.length} selected
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : routeCities.length > 0 ? (
        <div className="space-y-8">
          {routeCities.map((city) => {
            const activities = activitiesByCity[city.id] || [];
            const days = cityDays[city.id] || 1;

            return (
              <div key={city.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {city.name}, {city.country}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {days} day{days === 1 ? '' : 's'} · {activities.length} suggestions
                  </span>
                </div>

                {activities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onAdd={onToggle}
                        isAdded={selectedIds.includes(activity.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No activities found for {city.name}. Continue — we&apos;ll add travel placeholders.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">Add cities first, then pick activities.</p>
        </div>
      )}
    </div>
  );
};
