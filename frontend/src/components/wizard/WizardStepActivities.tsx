import React from 'react';
import { Sparkles } from 'lucide-react';
import { Activity } from '../../types';
import { ActivityCard } from '../search/ActivityCard';
import { Skeleton } from '../common/Skeleton';

interface WizardStepActivitiesProps {
  activities: Activity[];
  selectedIds: number[];
  onToggle: (activity: Activity) => void;
  loading?: boolean;
  cityName?: string;
}

export const WizardStepActivities: React.FC<WizardStepActivitiesProps> = ({
  activities,
  selectedIds,
  onToggle,
  loading = false,
  cityName,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            What do you want to do?
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {cityName
              ? `Suggested activities in ${cityName}. Optional — skip if you prefer to add later.`
              : 'Pick activities to pre-fill your itinerary. You can skip this step.'}
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
      ) : activities.length > 0 ? (
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">No activities found for this city. Continue to review.</p>
        </div>
      )}
    </div>
  );
};
