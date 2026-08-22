import React, { useEffect, useState } from 'react';
import { Trip } from '../../types';
import { tripsApi } from '../../api/trips';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Calendar } from 'lucide-react';
import {
  formatTripDuration,
  syncEndDateWithStart,
  validateTripDates,
  tripDurationDays,
} from '../../utils/validation';

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (trip: Trip) => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [description, setDescription] = useState(trip.description || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(trip.name);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setDescription(trip.description || '');
    setError(null);
  }, [isOpen, trip]);

  const durationLabel = startDate && endDate ? formatTripDuration(startDate, endDate) : '';

  const handleStartChange = (value: string) => {
    setStartDate(value);
    setEndDate((prev) => syncEndDateWithStart(value, prev));
  };

  const handleSave = async () => {
    const dateError = validateTripDates(startDate, endDate);
    if (!name.trim()) {
      setError('Trip name is required.');
      return;
    }
    if (dateError) {
      setError(dateError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await tripsApi.updateTrip(trip.id, {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || undefined,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update trip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Trip Details">
      <div className="space-y-4">
        <Input
          label="Trip Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip name"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            leftIcon={<Calendar className="h-4 w-4" />}
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            leftIcon={<Calendar className="h-4 w-4" />}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {durationLabel && tripDurationDays(startDate, endDate) > 0 && (
          <p className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-2 rounded-xl">
            {durationLabel} — same-day trips (start = end) are fully supported.
          </p>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" isLoading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
