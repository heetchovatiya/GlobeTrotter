import React from 'react';
import { Activity } from '../../types';
import { Badge } from '../common/Badge';
import { Price } from '../common/Price';
import { Button } from '../common/Button';
import { Clock, Plus, Check, Eye } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onAdd?: (activity: Activity) => void;
  onQuickView?: (activity: Activity) => void;
  isAdded?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onAdd,
  onQuickView,
  isAdded = false,
}) => {
  const getTypeBadge = (type: Activity['type']) => {
    switch (type) {
      case 'adventure':
        return <Badge variant="danger">Adventure</Badge>;
      case 'food':
        return <Badge variant="warning">Food & Wine</Badge>;
      case 'culture':
        return <Badge variant="purple">Culture</Badge>;
      case 'sightseeing':
        return <Badge variant="info">Sightseeing</Badge>;
      default:
        return <Badge variant="default">Nightlife</Badge>;
    }
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hours = (mins / 60).toFixed(1);
    return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} hrs`;
  };

  return (
    <div className="group rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-200 flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onQuickView?.(activity)}
        className="relative h-44 w-full overflow-hidden bg-slate-100 text-left"
      >
        <img
          src={activity.image_url}
          alt={activity.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">{getTypeBadge(activity.type)}</div>
        <div className="absolute bottom-3 right-3 rounded-xl bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-white text-xs font-bold flex items-center">
          {activity.cost === 0 ? 'Free' : <Price amount={activity.cost} />}
        </div>
        {onQuickView && (
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
              <Eye className="h-3.5 w-3.5" /> Quick View
            </span>
          </div>
        )}
      </button>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => onQuickView?.(activity)}
            className="text-left w-full"
          >
            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {activity.name}
            </h4>
          </button>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDuration(activity.duration_mins)}</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {activity.cost === 0 ? (
              'Complimentary'
            ) : (
              <>
                Estimated <Price amount={activity.cost} />/person
              </>
            )}
          </span>

          <div className="flex items-center gap-2">
            {onQuickView && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onQuickView(activity)}
                leftIcon={<Eye className="h-3.5 w-3.5" />}
              >
                View
              </Button>
            )}
            {onAdd && (
              <Button
                size="sm"
                variant={isAdded ? 'outline' : 'primary'}
                onClick={() => onAdd(activity)}
                leftIcon={
                  isAdded ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )
                }
                className={isAdded ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : ''}
              >
                {isAdded ? 'Added' : 'Add'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
