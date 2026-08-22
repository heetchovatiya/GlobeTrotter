import React, { useMemo, useState, useCallback } from 'react';
import { BudgetAllocation, SectionType, Stop, City, TripSection } from '../../types';
import { sectionsApi } from '../../api/sections';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { useCurrencyStore } from '../../store/currencyStore';
import {
  convertToUsd,
  convertAmount,
  currencySymbol,
  formatDisplayAmount,
} from '../../utils/currency';
import type { Currency } from '../../utils/currency';
import {
  resolveAllocation,
  countDaysInclusive,
  inferScopeAndMode,
} from '../../utils/budgetAllocation';
import { Price } from '../common/Price';
import { Home, Plane } from 'lucide-react';

interface AddItineraryExpenseModalProps {
  tripId: number | string;
  stops: Stop[];
  cities: City[];
  tripStart: string;
  tripEnd: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultType?: 'stay' | 'travel';
  defaultStopId?: number;
  defaultScope?: 'city' | 'trip';
  editSection?: TripSection | null;
}

type FormState = {
  sectionType: 'stay' | 'travel';
  stopId: number;
  scope: 'city' | 'trip' | 'dates';
  mode: 'total' | 'per_day' | 'single_day';
  title: string;
  amount: string;
  startDate: string;
  endDate: string;
};

function buildInitialForm(
  params: {
    defaultType: 'stay' | 'travel';
    defaultStopId?: number;
    defaultScope: 'city' | 'trip';
    editSection?: TripSection | null;
    sortedStops: Stop[];
    tripStart: string;
    tripEnd: string;
    currency: Currency;
  }
): FormState {
  const { defaultType, defaultStopId, defaultScope, editSection, sortedStops, tripStart, tripEnd, currency } =
    params;

  if (editSection) {
    const { scope, mode } = inferScopeAndMode(editSection.budget_allocation);
    const resolvedScope =
      editSection.budget_allocation === 'trip_total' ? 'trip' : scope;
    const displayAmount = Math.round(convertAmount(editSection.budget || 0, currency));
    return {
      sectionType: editSection.type === 'travel' ? 'travel' : 'stay',
      stopId: editSection.stop_id,
      scope: resolvedScope,
      mode,
      title: editSection.title,
      amount: displayAmount > 0 ? String(displayAmount) : '',
      startDate: editSection.date_range_start || tripStart,
      endDate: editSection.date_range_end || tripEnd,
    };
  }

  const isTripScope = defaultScope === 'trip';
  const stopId = defaultStopId ?? sortedStops[0]?.id ?? 0;
  const stop = sortedStops.find((s) => s.id === stopId);

  return {
    sectionType: defaultType,
    stopId,
    scope: isTripScope ? 'trip' : 'city',
    mode: 'total',
    title: '',
    amount: '',
    startDate: isTripScope ? tripStart : stop?.arrival_date || tripStart,
    endDate: isTripScope ? tripEnd : stop?.departure_date || tripEnd,
  };
}

export const AddItineraryExpenseModal: React.FC<AddItineraryExpenseModalProps> = ({
  tripId,
  stops,
  cities,
  tripStart,
  tripEnd,
  isOpen,
  onClose,
  onSaved,
  defaultType = 'stay',
  defaultStopId,
  defaultScope = 'city',
  editSection = null,
}) => {
  const { showToast } = useUIStore();
  const currency = useCurrencyStore((s) => s.currency);
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.order_index - b.order_index),
    [stops]
  );

  const isEditing = Boolean(editSection?.id);

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm({
      defaultType,
      defaultStopId,
      defaultScope,
      editSection,
      sortedStops,
      tripStart,
      tripEnd,
      currency,
    })
  );
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setForm(
      buildInitialForm({
        defaultType,
        defaultStopId,
        defaultScope,
        editSection: null,
        sortedStops,
        tripStart,
        tripEnd,
        currency,
      })
    );
  }, [defaultType, defaultStopId, defaultScope, sortedStops, tripStart, tripEnd, currency]);

  React.useEffect(() => {
    if (!isOpen) return;
    setForm(
      buildInitialForm({
        defaultType,
        defaultStopId,
        defaultScope,
        editSection,
        sortedStops,
        tripStart,
        tripEnd,
        currency,
      })
    );
  }, [
    isOpen,
    defaultType,
    defaultStopId,
    defaultScope,
    editSection,
    sortedStops,
    tripStart,
    tripEnd,
    currency,
  ]);

  const { sectionType, stopId, scope, mode, title, amount, startDate, endDate } = form;
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedStop = sortedStops.find((s) => s.id === stopId);
  const modalScope = isEditing
    ? scope === 'trip'
      ? 'trip'
      : 'city'
    : defaultScope;

  const effectiveDateRange = useMemo(() => {
    if (scope === 'trip' || modalScope === 'trip') {
      return { start: tripStart, end: tripEnd };
    }
    if (scope === 'city') {
      return {
        start: selectedStop?.arrival_date || startDate,
        end: selectedStop?.departure_date || endDate,
      };
    }
    return { start: startDate, end: endDate };
  }, [scope, modalScope, tripStart, tripEnd, selectedStop, startDate, endDate]);

  const dayCount = countDaysInclusive(effectiveDateRange.start, effectiveDateRange.end);
  const parsedAmount = parseFloat(amount) || 0;
  const computedTotal = mode === 'per_day' ? parsedAmount * dayCount : parsedAmount;

  const handleStopChange = (id: number) => {
    const stop = sortedStops.find((s) => s.id === id);
    setForm((prev) => ({
      ...prev,
      stopId: id,
      startDate: stop?.arrival_date || tripStart,
      endDate: stop?.departure_date || tripEnd,
    }));
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      showToast('error', 'Enter a valid amount.');
      return;
    }
    if (!stopId) {
      showToast('error', 'Select a city stop.');
      return;
    }

    const allocation: BudgetAllocation = resolveAllocation(scope, mode);
    const dateStart = effectiveDateRange.start;
    const dateEnd = effectiveDateRange.end;

    const payload = {
      title: title.trim() || (sectionType === 'stay' ? 'Stay expense' : 'Transport expense'),
      type: sectionType as SectionType,
      date_range_start: dateStart,
      date_range_end: dateEnd,
      budget: convertToUsd(parsed, currency),
      budget_allocation: allocation,
      notes: `Allocation: ${allocation}`,
    };

    setSaving(true);
    try {
      if (isEditing && editSection) {
        await sectionsApi.updateSection(editSection.id, payload);
        showToast('success', 'Itinerary expense updated.');
      } else {
        await sectionsApi.createSection(tripId, stopId, payload);
        showToast('success', 'Itinerary expense saved.');
      }
      onSaved();
      resetForm();
      onClose();
    } catch {
      showToast('error', 'Could not save itinerary expense.');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = isEditing
    ? sectionType === 'stay'
      ? 'Edit stay expense'
      : 'Edit transport expense'
    : sectionType === 'stay'
      ? 'Add stay expense'
      : 'Add transport expense';

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={modalTitle} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">
          {modalScope === 'trip'
            ? 'Full trip cost — split day-wise across all trip dates.'
            : 'City cost — split across its days, or choose per day / single day.'}{' '}
          <span className="font-semibold text-slate-600">
            Nothing is saved until you click Save.
          </span>
        </p>

        {!isEditing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setField('sectionType', 'stay')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${
                sectionType === 'stay'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Home className="h-4 w-4" /> Stay
            </button>
            <button
              type="button"
              onClick={() => setField('sectionType', 'travel')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold ${
                sectionType === 'travel'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Plane className="h-4 w-4" /> Transport
            </button>
          </div>
        )}

        {modalScope === 'trip' ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2.5 text-xs text-brand-900">
            <span className="font-bold">Full trip</span>
            <span className="text-brand-700">
              {' '}
              — {tripStart} to {tripEnd}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              City / stop
            </label>
            <select
              value={stopId}
              onChange={(e) => handleStopChange(Number(e.target.value))}
              disabled={Boolean(defaultStopId) || isEditing}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-600"
            >
              {sortedStops.map((stop) => {
                const city = cities.find((c) => c.id === stop.city_id);
                return (
                  <option key={stop.id} value={stop.id}>
                    {city?.name || `Stop ${stop.order_index}`} ({stop.arrival_date} –{' '}
                    {stop.departure_date})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder={sectionType === 'stay' ? 'e.g. Hotel Grand Plaza' : 'e.g. Train to Jaipur'}
        />

        <div className={`grid grid-cols-1 gap-4 ${modalScope === 'trip' ? '' : 'sm:grid-cols-2'}`}>
          {modalScope !== 'trip' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Applies to
              </label>
              <select
                value={scope}
                onChange={(e) => setField('scope', e.target.value as FormState['scope'])}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="city">This city only</option>
                <option value="dates">Custom date range</option>
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Amount type
            </label>
            <select
              value={mode}
              onChange={(e) => setField('mode', e.target.value as FormState['mode'])}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="total">Total (split across days)</option>
              <option value="per_day">Per day rate</option>
              <option value="single_day">Single day only</option>
            </select>
          </div>
        </div>

        {scope === 'dates' && modalScope !== 'trip' && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From"
              type="date"
              min={tripStart}
              max={tripEnd}
              value={startDate}
              onChange={(e) => setField('startDate', e.target.value)}
            />
            <Input
              label="To"
              type="date"
              min={startDate}
              max={tripEnd}
              value={endDate}
              onChange={(e) => setField('endDate', e.target.value)}
            />
          </div>
        )}

        <Input
          label={`Amount (${currencySymbol(currency)})${mode === 'per_day' ? ' per day' : ''}`}
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setField('amount', e.target.value)}
        />

        {mode === 'per_day' && parsedAmount > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-900">
            <span className="font-bold">
              {formatDisplayAmount(parsedAmount, currency)} × {dayCount} day
              {dayCount === 1 ? '' : 's'}
            </span>
            <span className="text-emerald-800">
              {' '}
              = total <Price amount={convertToUsd(computedTotal, currency)} zeroAsFree={false} />
            </span>
            <p className="text-[10px] text-emerald-700 mt-1">
              {effectiveDateRange.start} – {effectiveDateRange.end}
            </p>
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 -mb-6 mt-2 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
