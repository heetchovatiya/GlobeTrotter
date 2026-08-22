import React, { useMemo } from 'react';
import { Calendar, Sun, Sparkles } from 'lucide-react';
import { Input } from '../common/Input';
import { formatTripDuration, syncEndDateWithStart, tripDurationDays } from '../../utils/validation';
import { formatDateRange, getUpcomingLongWeekends, LongWeekend } from '../../utils/holidays';

interface WizardStepDatesProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDayTrip: () => void;
}

export const WizardStepDates: React.FC<WizardStepDatesProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onDayTrip,
}) => {
  const longWeekends = useMemo(() => getUpcomingLongWeekends(5), []);

  const durationLabel =
    startDate && endDate && tripDurationDays(startDate, endDate) > 0
      ? formatTripDuration(startDate, endDate)
      : '';

  const handleStartChange = (value: string) => {
    onStartDateChange(value);
    onEndDateChange(syncEndDateWithStart(value, endDate));
  };

  const applyLongWeekend = (lw: LongWeekend) => {
    onStartDateChange(lw.startDate);
    onEndDateChange(lw.endDate);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">When are you travelling?</h2>
        <p className="text-sm text-slate-500 mt-1">
          Set your travel dates or pick a suggested long weekend around public holidays.
        </p>
      </div>

      {longWeekends.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-brand-50 border border-teal-100 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Suggested long weekends
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {longWeekends.map((lw) => {
              const active = startDate === lw.startDate && endDate === lw.endDate;
              return (
                <button
                  key={lw.id}
                  type="button"
                  onClick={() => applyLongWeekend(lw)}
                  className={`text-left rounded-xl px-3 py-2 border transition-all max-w-full ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                      : 'border-white/80 bg-white/90 hover:border-brand-300 text-slate-800'
                  }`}
                >
                  <span className="block text-[11px] font-bold truncate">{lw.holidayNames[0] ?? 'Getaway'}</span>
                  <span className={`block text-[10px] ${active ? 'text-brand-100' : 'text-slate-500'}`}>
                    {formatDateRange(lw.startDate, lw.endDate)} · {lw.totalDays}d
                    {lw.leaveDaysRequired > 0 ? ` · ${lw.leaveDaysRequired} leave` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Travel dates
          </span>
          <button
            type="button"
            onClick={onDayTrip}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors"
          >
            <Sun className="h-3.5 w-3.5" />
            Same-day trip
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start date"
            type="date"
            required
            leftIcon={<Calendar className="h-4 w-4" />}
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            required
            leftIcon={<Calendar className="h-4 w-4" />}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
            hint="Can match start for day trips"
          />
        </div>

        {durationLabel && (
          <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {durationLabel}
          </p>
        )}
      </div>
    </div>
  );
};
