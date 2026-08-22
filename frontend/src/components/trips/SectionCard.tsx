import React, { useState } from 'react';
import { TripSection, SectionType } from '../../types';
import { Input } from '../common/Input';
import { Plane, Home, Compass, MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { CurrencyIcon } from '../common/CurrencyIcon';
import { useCurrencyStore } from '../../store/currencyStore';
import { convertAmount, convertToUsd, currencySymbol } from '../../utils/currency';

import { validateSectionDates, syncEndDateWithStart } from '../../utils/validation';

interface SectionCardProps {
  section: TripSection;
  index: number;
  tripStart?: string;
  tripEnd?: string;
  onUpdate: (index: number, updates: Partial<TripSection>) => void;
  onRemove: (index: number) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  index,
  tripStart,
  tripEnd,
  onUpdate,
  onRemove,
}) => {
  const currency = useCurrencyStore((s) => s.currency);
  const displayBudget = Math.round(convertAmount(Number(section.budget) || 0, currency));
  const [dateError, setDateError] = useState<string | null>(null);

  const applyDateUpdate = (updates: Partial<TripSection>) => {
    const start = updates.date_range_start ?? section.date_range_start;
    const end = updates.date_range_end ?? section.date_range_end;
    const err = validateSectionDates(start, end, tripStart, tripEnd);
    setDateError(err);
    if (!err) onUpdate(index, updates);
  };

  const typeIcons: Record<SectionType, React.ReactNode> = {
    travel: <Plane className="h-4 w-4 text-blue-500" />,
    stay: <Home className="h-4 w-4 text-emerald-500" />,
    activity: <Compass className="h-4 w-4 text-amber-500" />,
    other: <MoreHorizontal className="h-4 w-4 text-purple-500" />,
  };

  const typeLabels: Record<SectionType, string> = {
    travel: 'Travel / Transport',
    stay: 'Stay / Hotel',
    activity: 'Sightseeing / Activity',
    other: 'General / Other',
  };

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 shadow-soft p-5 sm:p-6 transition-all hover:border-brand-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
            {index + 1}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {section.title || `Section ${index + 1}`}
            </h4>
            <span className="text-xs text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
              {typeIcons[section.type]} {typeLabels[section.type]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Type Selector Dropdown */}
          <select
            value={section.type}
            onChange={(e) => onUpdate(index, { type: e.target.value as SectionType })}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none"
          >
            <option value="travel">✈️ Travel</option>
            <option value="stay">🏨 Stay</option>
            <option value="activity">🎯 Activity</option>
            <option value="other">📦 Other</option>
          </select>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {/* Title Input */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Input
            label="Section Title"
            value={section.title}
            onChange={(e) => onUpdate(index, { title: e.target.value })}
            placeholder="e.g. Flight to Tokyo, Ryokan Check-in"
          />
        </div>

        {/* Start Date */}
        <div>
          <Input
            label="Start Date"
            type="date"
            leftIcon={<Calendar className="h-4 w-4" />}
            value={section.date_range_start}
            min={tripStart}
            max={tripEnd}
            onChange={(e) => {
              const start = e.target.value;
              const end = syncEndDateWithStart(start, section.date_range_end);
              applyDateUpdate({ date_range_start: start, date_range_end: end });
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            label="End Date"
            type="date"
            leftIcon={<Calendar className="h-4 w-4" />}
            value={section.date_range_end}
            min={section.date_range_start || tripStart}
            max={tripEnd}
            onChange={(e) => applyDateUpdate({ date_range_end: e.target.value })}
            hint="Same as start for single-day activities"
          />
        </div>

        {/* Budget Allocation */}
        <div>
          <Input
            label={`Budget Allocation (${currencySymbol(currency)})`}
            type="number"
            min="0"
            step={currency === 'INR' ? '100' : '10'}
            leftIcon={<CurrencyIcon className="h-4 w-4" />}
            value={displayBudget}
            onChange={(e) =>
              onUpdate(index, {
                budget: convertToUsd(parseFloat(e.target.value) || 0, currency),
              })
            }
            placeholder="Budget amount"
          />
        </div>

        {dateError && (
          <p className="sm:col-span-2 lg:col-span-3 text-xs text-rose-600 font-medium">{dateError}</p>
        )}

        {/* Notes & Information */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Information / Notes
          </label>
          <textarea
            rows={2}
            value={section.notes || ''}
            onChange={(e) => onUpdate(index, { notes: e.target.value })}
            placeholder="Booking confirmation, transfer instructions, packing details..."
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>
    </div>
  );
};

