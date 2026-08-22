import React from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { City } from '../../types';

interface WizardStepCityDaysProps {
  cities: City[];
  cityIds: number[];
  cityDays: Record<number, number>;
  totalTripDays: number;
  onCityDaysChange: (cityId: number, days: number) => void;
  onAutoDistribute: () => void;
}

export const WizardStepCityDays: React.FC<WizardStepCityDaysProps> = ({
  cities,
  cityIds,
  cityDays,
  totalTripDays,
  onCityDaysChange,
  onAutoDistribute,
}) => {
  const selectedCities = cityIds
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean) as City[];

  const allocated = cityIds.reduce((sum, id) => sum + (cityDays[id] || 0), 0);
  const remaining = totalTripDays - allocated;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand-600" />
          How many days in each city?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          We use this to build your daily schedule and suggest activities that fit your time in each
          stop.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Trip length: {totalTripDays} day{totalTripDays === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onAutoDistribute}
            className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100"
          >
            Auto-distribute evenly
          </button>
        </div>

        <div className="space-y-3">
          {selectedCities.map((city) => (
            <div
              key={city.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{city.name}</p>
                  <p className="text-xs text-slate-500">{city.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600" htmlFor={`days-${city.id}`}>
                  Days
                </label>
                <input
                  id={`days-${city.id}`}
                  type="number"
                  min={0}
                  max={totalTripDays}
                  value={cityDays[city.id] ?? 0}
                  onChange={(e) => onCityDaysChange(city.id, Number(e.target.value))}
                  className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          ))}
        </div>

        <p
          className={`text-sm font-semibold px-4 py-3 rounded-xl ${
            remaining === 0
              ? 'text-emerald-700 bg-emerald-50'
              : remaining > 0
                ? 'text-amber-700 bg-amber-50'
                : 'text-rose-700 bg-rose-50'
          }`}
        >
          {remaining === 0
            ? 'All trip days allocated across your cities.'
            : remaining > 0
              ? `${remaining} day${remaining === 1 ? '' : 's'} still unassigned — add them to a city.`
              : `${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'} over the trip length — reduce city days.`}
        </p>
      </div>
    </div>
  );
};
