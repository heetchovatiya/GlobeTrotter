import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesApi } from '../../api/templates';
import { TripTemplate } from '../../types';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Skeleton } from '../common/Skeleton';
import { LayoutTemplate, MapPin, Calendar, Sparkles } from 'lucide-react';

interface TripTemplatePickerProps {
  onUseWizard?: () => void;
}

export const TripTemplatePicker: React.FC<TripTemplatePickerProps> = ({ onUseWizard }) => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    templatesApi
      .listTemplates()
      .then(setTemplates)
      .catch(() => showToast('error', 'Could not load templates.'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleUseTemplate = async (template: TripTemplate) => {
    setCreating(template.id);
    try {
      const trip = await templatesApi.instantiateTemplate(template.id, { start_date: startDate });
      showToast('success', `${template.name} created!`);
      navigate(`/trips/${trip.id}/confirmed`);
    } catch {
      showToast('error', 'Could not create trip from template.');
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-brand-600" />
            Start from a template
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Pre-built routes with sections — pick one or use the custom wizard below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase text-slate-400">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft hover:shadow-card transition-shadow space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900">{tmpl.name}</h3>
              <span className="text-[10px] font-bold uppercase bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full shrink-0">
                {tmpl.duration_days} days
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
            <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {tmpl.stop_count} stops
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {tmpl.section_count} sections
              </span>
            </div>
            <p className="text-[10px] font-mono text-brand-700 truncate">{tmpl.city_names.join(' → ')}</p>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              isLoading={creating === tmpl.id}
              leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => handleUseTemplate(tmpl)}
            >
              Use this template
            </Button>
          </div>
        ))}
      </div>

      {onUseWizard && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onUseWizard}
            className="text-sm font-semibold text-slate-500 hover:text-brand-600 underline-offset-2 hover:underline"
          >
            Or build a custom trip with the step wizard →
          </button>
        </div>
      )}
    </div>
  );
};
