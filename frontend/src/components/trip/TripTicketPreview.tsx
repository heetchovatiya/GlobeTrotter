import React from 'react';
import { Calendar, MapPin, Compass } from 'lucide-react';
import { Price } from '../common/Price';

interface TripTicketPreviewProps {
  name: string;
  startDate: string;
  endDate: string;
  duration: string;
  routeLabel: string;
  cityNames: string[];
  estimatedBudget: number;
  stopCount: number;
  dayCount: number;
  coverPreview?: string | null;
}

export const TripTicketPreview: React.FC<TripTicketPreviewProps> = ({
  name,
  startDate,
  endDate,
  duration,
  routeLabel,
  estimatedBudget,
  stopCount,
  dayCount,
  coverPreview,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-rose-300 bg-gradient-to-br from-white via-rose-50/30 to-brand-50/40 shadow-soft">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-rose-500 to-brand-500" />

      {coverPreview && (
        <div className="h-24 sm:h-28 overflow-hidden">
          <img src={coverPreview} alt="" className="h-full w-full object-cover opacity-90" />
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
              GlobeTrotter · Preview
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Not yet confirmed</p>
          </div>
          <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
            Draft
          </span>
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 line-clamp-2">{name}</h3>
          {startDate && endDate && (
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-brand-500" />
                {startDate} – {endDate}
              </span>
              {duration && <span className="font-semibold text-brand-700">{duration}</span>}
            </div>
          )}
        </div>

        {routeLabel !== '—' && (
          <div className="rounded-xl bg-white/80 border border-slate-200/80 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Route
            </p>
            <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">{routeLabel}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-400">Days</p>
            <p className="text-base font-bold text-slate-900">{dayCount || '—'}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-400">Stops</p>
            <p className="text-base font-bold text-slate-900">{stopCount || '—'}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
            <p className="text-[9px] font-bold uppercase text-slate-400">Est.</p>
            <p className="text-base font-bold text-emerald-600">
              {estimatedBudget > 0 ? <Price amount={estimatedBudget} /> : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-dashed border-rose-200 bg-rose-50/40 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-700">
        <Compass className="h-3 w-3" />
        Confirm on next step
      </div>
    </div>
  );
};
