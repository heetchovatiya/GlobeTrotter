import React, { useMemo } from 'react';
import { CalendarDays, ChevronRight, Palmtree } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  formatDateRange,
  getUpcomingLongWeekends,
  isDateInPast,
  LongWeekend,
} from '../../utils/holidays';

interface LongWeekendPanelProps {
  limit?: number;
  onSelect: (weekend: LongWeekend) => void;
  compact?: boolean;
}

export const LongWeekendPanel: React.FC<LongWeekendPanelProps> = ({
  limit = 6,
  onSelect,
  compact = false,
}) => {
  const weekends = useMemo(() => getUpcomingLongWeekends(limit), [limit]);

  if (weekends.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Suggested long weekends</h3>
            {!compact && (
              <p className="text-xs text-slate-500">
                Public holidays + weekends — tap to plan a trip around these dates
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {weekends.map((lw) => {
          const past = isDateInPast(lw.endDate);
          return (
            <button
              key={lw.id}
              type="button"
              disabled={past}
              onClick={() => onSelect(lw)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                past
                  ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                  : 'border-slate-200/80 bg-white hover:border-brand-400 hover:shadow-soft shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">{lw.title}</p>
                  <p className="text-xs text-brand-700 font-semibold mt-1">
                    {formatDateRange(lw.startDate, lw.endDate)}
                  </p>
                </div>
                <Palmtree className="h-5 w-5 text-teal-500 flex-shrink-0" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge variant="info" size="sm">
                  {lw.totalDays} days
                </Badge>
                {lw.leaveDaysRequired === 0 ? (
                  <Badge variant="success" size="sm">
                    No leave needed
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    {lw.leaveDaysRequired} leave day{lw.leaveDaysRequired === 1 ? '' : 's'}
                  </Badge>
                )}
              </div>
              {!compact && (
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-brand-600">
                  Plan trip
                  <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => onSelect(weekends[0])}>
            Plan around next long weekend
          </Button>
        </div>
      )}
    </div>
  );
};
