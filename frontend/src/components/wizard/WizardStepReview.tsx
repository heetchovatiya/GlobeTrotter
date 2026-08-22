import React from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { Input } from '../common/Input';
import { TripTicketPreview } from '../trip/TripTicketPreview';
import { formatRouteCodes } from '../../utils/cityCodes';
import { formatTripDuration } from '../../utils/validation';

interface WizardStepReviewProps {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  cityNames: string[];
  estimatedBudget: number;
  coverPreview: string | null;
  coverPhotoUrl: string;
  coverFile: File | null;
  selectedActivityCount: number;
  dayCount: number;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
  onClearCover: () => void;
  onPickFile: () => void;
}

export const WizardStepReview: React.FC<WizardStepReviewProps> = ({
  name,
  description,
  startDate,
  endDate,
  cityNames,
  estimatedBudget,
  coverPreview,
  coverPhotoUrl,
  coverFile,
  selectedActivityCount,
  dayCount,
  onNameChange,
  onDescriptionChange,
  onCoverUrlChange,
  onClearCover,
  onPickFile,
}) => {
  const duration = startDate && endDate ? formatTripDuration(startDate, endDate) : '';
  const displayName = name.trim() || 'Your trip';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Review & confirm</h2>
        <p className="text-sm text-slate-500 mt-1">
          Name your trip and check the ticket preview before confirming.
        </p>
      </div>

      <TripTicketPreview
        name={displayName}
        startDate={startDate}
        endDate={endDate}
        duration={duration}
        routeLabel={formatRouteCodes(cityNames)}
        cityNames={cityNames}
        estimatedBudget={estimatedBudget}
        stopCount={cityNames.length}
        dayCount={dayCount}
        coverPreview={coverPreview}
      />

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
        <Input
          label="Trip name"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Summer in Rajasthan"
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Highlights, companions, or goals..."
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Cover photo <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>

          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={coverPreview} alt="Cover" className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={onClearCover}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPickFile}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-6 text-sm text-slate-500 hover:border-brand-400 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="font-semibold">Upload cover</span>
            </button>
          )}

          {!coverFile && (
            <Input
              label="Or image URL"
              leftIcon={<ImageIcon className="h-4 w-4" />}
              value={coverPhotoUrl}
              onChange={(e) => onCoverUrlChange(e.target.value)}
              placeholder="https://..."
            />
          )}
        </div>

        <p className="text-xs text-slate-500">
          {selectedActivityCount > 0
            ? `${selectedActivityCount} activit${selectedActivityCount === 1 ? 'y' : 'ies'} will be added to your plan.`
            : 'A default arrival section will be created. Add more in the itinerary builder.'}
        </p>
      </div>
    </div>
  );
};
