import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { formatDateRange, LongWeekend } from '../../utils/holidays';

interface PlanTripPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
  title?: string;
  subtitle?: string;
  longWeekend?: LongWeekend | null;
}

export const PlanTripPromptModal: React.FC<PlanTripPromptModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  title = 'Plan your trip',
  subtitle,
  longWeekend,
}) => {
  const navigate = useNavigate();

  const resolvedStart = longWeekend?.startDate ?? startDate;
  const resolvedEnd = longWeekend?.endDate ?? endDate ?? startDate;

  const handlePlan = () => {
    onClose();
    const params = new URLSearchParams();
    if (resolvedStart) params.set('start', resolvedStart);
    if (resolvedEnd) params.set('end', resolvedEnd);
    navigate(`/trips/new?${params.toString()}`);
  };

  const dateLabel =
    resolvedStart && resolvedEnd
      ? formatDateRange(resolvedStart, resolvedEnd)
      : resolvedStart
        ? formatDateRange(resolvedStart, resolvedStart)
        : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 border border-brand-100 p-5 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {subtitle ??
              (longWeekend
                ? `Turn this ${longWeekend.totalDays}-day break into a getaway${
                    longWeekend.leaveDaysRequired > 0
                      ? ` — only ${longWeekend.leaveDaysRequired} leave day${longWeekend.leaveDaysRequired === 1 ? '' : 's'} needed`
                      : ' with no extra leave'
                  }.`
                : 'Pick your dates and build a multi-city itinerary in minutes.')}
          </p>
          {dateLabel && (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-800 bg-white/80 px-3 py-1.5 rounded-full border border-brand-200">
              <Calendar className="h-3.5 w-3.5" />
              {dateLabel}
            </div>
          )}
          {longWeekend && longWeekend.holidayNames.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Includes: {longWeekend.holidayNames.join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Not now
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            leftIcon={<MapPin className="h-4 w-4" />}
            onClick={handlePlan}
          >
            Plan your trip
          </Button>
        </div>
      </div>
    </Modal>
  );
};
