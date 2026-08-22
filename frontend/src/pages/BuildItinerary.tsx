import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTripBuilderStore } from '../store/tripBuilderStore';
import { SectionCard } from '../components/trips/SectionCard';
import { Button } from '../components/common/Button';
import { useUIStore } from '../store/uiStore';
import {
  Plus,
  Save,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const BuildItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const {
    trip,
    sections,
    saveStatus,
    lastSavedAt,
    loadTrip,
    addSection,
    updateSection,
    removeSection,
    saveAllSections,
  } = useTripBuilderStore();

  useEffect(() => {
    if (id) {
      loadTrip(id);
    }
  }, [id, loadTrip]);

  const handleAddSection = (type: 'travel' | 'stay' | 'activity' | 'other' = 'activity') => {
    addSection(type);
    showToast('info', `Added new ${type} section block.`);
  };

  const handleFinish = async () => {
    const success = await saveAllSections();
    if (success) {
      showToast('success', 'Itinerary sections saved!');
      navigate(`/trips/${id || trip?.id || 1}`);
    }
  };

  const totalAllocatedBudget = sections.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Banner / Trip Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Layers className="h-3 w-3" /> Screen 5 Builder
            </span>
            {/* Autosave badge */}
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
              {saveStatus === 'saving' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Saving changes...
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Autosaved {lastSavedAt}
                </span>
              )}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Build Itinerary: {trip?.name || 'Trip Sections'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-500" />
              {trip?.start_date} – {trip?.end_date}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700">Allocated Budget:</span>
              <span className="font-bold text-emerald-600">${totalAllocatedBudget.toLocaleString()}</span>
            </span>
            <span>{sections.length} Active Sections</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleFinish}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className="shadow-md shadow-brand-500/20 w-full md:w-auto"
          >
            View Live Itinerary
          </Button>
        </div>
      </div>

      {/* Repeating Section Blocks (Screen 5 wireframe) */}
      <div className="space-y-5">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id || index}
            section={section}
            index={index}
            onUpdate={updateSection}
            onRemove={removeSection}
          />
        ))}
      </div>

      {/* Add Section Buttons Bar */}
      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Add Another Itinerary Section</h4>
          <p className="text-xs text-slate-500">
            Each section represents a distinct travel leg, hotel stay, tour, or custom activity block.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSection('activity')}
            leftIcon={<Plus className="h-4 w-4 text-amber-500" />}
          >
            + Add Activity / Sightseeing
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSection('stay')}
            leftIcon={<Plus className="h-4 w-4 text-emerald-500" />}
          >
            + Add Hotel / Stay
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSection('travel')}
            leftIcon={<Plus className="h-4 w-4 text-blue-500" />}
          >
            + Add Flight / Train
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddSection('other')}
            leftIcon={<Plus className="h-4 w-4 text-purple-500" />}
          >
            + Add Other Block
          </Button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link to="/trips">
          <Button variant="ghost">Back to My Trips</Button>
        </Link>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleFinish}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Finish & Inspect Budget Breakdown
        </Button>
      </div>
    </div>
  );
};

