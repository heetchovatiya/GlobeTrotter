import React from 'react';
import { ItineraryResponse } from '../../types';
import { Price } from '../common/Price';
import { formatTripDuration, tripDurationDays } from '../../utils/validation';
import { formatRouteCodes } from '../../utils/cityCodes';
import { Calendar, MapPin, Compass } from 'lucide-react';
import { TripQrCode } from './TripQrCode';

interface TripTicketCardProps {
  itinerary: ItineraryResponse;
  shareUrl?: string;
  className?: string;
}

export const TripTicketCard: React.FC<TripTicketCardProps> = ({
  itinerary,
  shareUrl,
  className = '',
}) => {
  const { trip, days, budget } = itinerary;
  const duration = formatTripDuration(trip.start_date, trip.end_date);
  const cityNames = [...new Set(days.map((d) => d.city_name).filter(Boolean))] as string[];
  const stopCount = cityNames.length;
  const routeLabel = formatRouteCodes(cityNames);
  const dayCount = tripDurationDays(trip.start_date, trip.end_date);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed border-rose-300 bg-gradient-to-br from-white via-rose-50/20 to-brand-50/40 shadow-soft ${className}`}
    >
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-rose-500 to-brand-500" />

      {/* Perforated notch effect */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-slate-50 border border-rose-200" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-6 w-6 rounded-full bg-slate-50 border border-rose-200" />

      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
              GlobeTrotter Travel Plan
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Trip #{String(trip.id).padStart(4, '0')} · GT-{String(trip.id).padStart(4, '0')}
            </p>
          </div>
          <span className="rounded-full bg-brand-100 text-brand-800 px-3 py-1 text-xs font-bold uppercase">
            {trip.status}
          </span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{trip.name}</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-500" />
              {trip.start_date} – {trip.end_date}
            </span>
            {duration && <span className="text-brand-700 font-semibold">{duration}</span>}
          </div>
        </div>

        {routeLabel !== '—' && (
          <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Route
            </p>
            <p className="text-base font-mono font-extrabold text-slate-800 mt-1 tracking-wide">
              {routeLabel}
            </p>
            {stopCount > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                {stopCount} stop{stopCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-stretch gap-4">
          <div className="grid grid-cols-3 gap-2 flex-1 min-w-[180px]">
            <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400">Days</p>
              <p className="text-lg font-bold text-slate-900">{dayCount}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400">Stops</p>
              <p className="text-lg font-bold text-slate-900">{stopCount || '—'}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200/80 p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400">Budget</p>
              <p className="text-sm font-bold text-emerald-600">
                <Price amount={budget.total_budget} />
              </p>
            </div>
          </div>

          {shareUrl && (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-200/80 p-3">
              <TripQrCode url={shareUrl} size={88} />
              <p className="text-[9px] font-bold uppercase text-slate-500 text-center leading-tight">
                Scan for live itinerary
              </p>
            </div>
          )}
        </div>

        {shareUrl && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 break-all">
            <span className="font-semibold text-slate-700">Live link: </span>
            {shareUrl}
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed">
          This is a travel itinerary plan, not a transport ticket. Generated by GlobeTrotter.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-dashed border-rose-200 bg-rose-50/40 py-2.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
        <Compass className="h-3.5 w-3.5" />
        Keep this for your records
      </div>
    </div>
  );
};
