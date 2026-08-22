import React from 'react';
import { MapPin, Plus, X, ArrowRight } from 'lucide-react';
import { CitySelect } from '../common/CitySelect';
import { City } from '../../types';
import { formatRouteCodes } from '../../utils/cityCodes';

interface WizardStepRouteProps {
  cities: City[];
  cityIds: number[];
  onAddCity: (cityId: number) => void;
  onRemoveCity: (cityId: number) => void;
  onSetPrimary: (cityId: number) => void;
  pickerCityId: number;
  onPickerChange: (cityId: number) => void;
}

export const WizardStepRoute: React.FC<WizardStepRouteProps> = ({
  cities,
  cityIds,
  onAddCity,
  onRemoveCity,
  onSetPrimary,
  pickerCityId,
  onPickerChange,
}) => {
  const selectedCities = cityIds
    .map((id) => cities.find((c) => c.id === id))
    .filter(Boolean) as City[];

  const routeLabel = formatRouteCodes(selectedCities.map((c) => c.name));
  const primaryCity = selectedCities[0];
  const canAddMore = cityIds.length < 4 && pickerCityId && !cityIds.includes(pickerCityId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Where are you going?</h2>
        <p className="text-sm text-slate-500 mt-1">
          Your home town is pre-filled as the starting point. Add up to 3 more destinations — your
          route preview updates as you go.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
        <CitySelect
          cities={cities}
          value={pickerCityId}
          onChange={onPickerChange}
          label="Add destination"
          placeholder="Search destination"
        />

        {canAddMore && (
          <button
            type="button"
            onClick={() => onAddCity(pickerCityId)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add to route
          </button>
        )}

        {selectedCities.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your route</p>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCities.map((city, idx) => (
                <React.Fragment key={city.id}>
                  {idx > 0 && <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                      idx === 0
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    {idx === 0 ? `Start: ${city.name}` : city.name}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onRemoveCity(city.id)}
                        className="ml-0.5 p-0.5 rounded hover:bg-black/10"
                        aria-label={`Remove ${city.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => onSetPrimary(city.id)}
                        className="ml-1 text-[10px] underline opacity-80 hover:opacity-100"
                      >
                        Make primary
                      </button>
                    )}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">
              {routeLabel}
            </p>
          </div>
        )}
      </div>

      {primaryCity && (
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft">
          <div className="relative h-40 sm:h-48">
            <img
              src={primaryCity.image_url}
              alt={primaryCity.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs font-semibold text-white/80">{primaryCity.country}</p>
              <p className="text-xl font-extrabold">{primaryCity.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
