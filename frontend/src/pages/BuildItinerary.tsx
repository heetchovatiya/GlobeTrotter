import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { City } from '../types';
import { citiesApi } from '../api/cities';
import { useTripBuilderStore } from '../store/tripBuilderStore';
import { SectionCard } from '../components/trips/SectionCard';
import { StopCard } from '../components/trips/StopCard';
import { Button } from '../components/common/Button';
import { Price } from '../components/common/Price';
import { useUIStore } from '../store/uiStore';
import {
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react';

export const BuildItinerary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const [cities, setCities] = useState<City[]>([]);

  const {
    trip,
    sections,
    saveStatus,
    lastSavedAt,
    loadTrip,
    addStop,
    updateStop,
    removeStop,
    reorderStop,
    assignActivityToStop,
    addSection,
    updateSection,
    removeSection,
    saveAllSections,
  } = useTripBuilderStore();

  useEffect(() => {
    if (id) loadTrip(id);
  }, [id, loadTrip]);

  useEffect(() => {
    citiesApi.getCities().then(setCities).catch(console.error);
  }, []);

  const stops = [...(trip?.stops || [])].sort((a, b) => a.order_index - b.order_index);

  const handleAddStop = async () => {
    const defaultCityId = cities[0]?.id;
    if (!defaultCityId) {
      showToast('error', 'No cities available to add as a stop.');
      return;
    }
    await addStop(defaultCityId);
    showToast('success', 'New stop added.');
  };

  const handleAddSection = (type: 'travel' | 'stay' | 'activity' | 'other' = 'activity') => {
    addSection(type);
    showToast('info', `Added new ${type} section block.`);
  };

  const handleAssignActivity = (stopId: number, activity: Parameters<typeof assignActivityToStop>[1]) => {
    assignActivityToStop(stopId, activity);
    showToast('success', `Assigned "${activity.name}" to this stop.`);
  };

  const handleFinish = async () => {
    const success = await saveAllSections();
    if (success) {
      showToast('success', 'Itinerary saved!');
      navigate(`/trips/${id || trip?.id}`);
    }
  };

  const totalAllocatedBudget = sections.reduce((sum, s) => sum + (Number(s.budget) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Layers className="h-3 w-3" /> Itinerary Builder
            </span>
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
            Build Itinerary: {trip?.name || 'Trip Plan'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-500" />
              {trip?.start_date} – {trip?.end_date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              {stops.length} stop{stops.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-700">Allocated Budget:</span>
              <span className="font-bold text-emerald-600">
                <Price amount={totalAllocatedBudget} />
              </span>
            </span>
            <span>{sections.length} section{sections.length === 1 ? '' : 's'}</span>
          </div>
        </div>

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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Trip Stops & Cities</h2>
            <p className="text-xs text-slate-500">
              Add cities, set travel dates, assign activities, and reorder your route.
            </p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddStop}>
            Add Stop
          </Button>
        </div>

        {stops.length > 0 ? (
          <div className="space-y-4">
            {stops.map((stop, index) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={index}
                totalStops={stops.length}
                cities={cities}
                onUpdate={updateStop}
                onRemove={removeStop}
                onReorder={reorderStop}
                onAssignActivity={handleAssignActivity}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No stops yet</p>
            <p className="text-xs text-slate-500 mt-1">Add your first city stop to begin building the itinerary.</p>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Day-wise Sections</h2>
          <p className="text-xs text-slate-500">
            Travel legs, stays, and activity blocks grouped under each stop.
          </p>
        </div>

        {stops.map((stop) => {
          const stopSections = sections.filter((section) => section.stop_id === stop.id);
          const cityLabel =
            cities.find((city) => city.id === stop.city_id)?.name || `Stop ${stop.order_index}`;

          return (
            <div key={`sections-${stop.id}`} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-500" />
                {cityLabel}
              </h3>
              {stopSections.length > 0 ? (
                stopSections.map((section, index) => {
                  const globalIndex = sections.findIndex((s) => s.id === section.id);
                  return (
                    <SectionCard
                      key={section.id || `${stop.id}-${index}`}
                      section={section}
                      index={globalIndex}
                      onUpdate={updateSection}
                      onRemove={removeSection}
                    />
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 pl-6">No sections for this stop yet.</p>
              )}
            </div>
          );
        })}
      </section>

      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Add Another Itinerary Section</h4>
          <p className="text-xs text-slate-500">
            Each section represents a distinct travel leg, hotel stay, tour, or custom activity block.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={() => handleAddSection('activity')} leftIcon={<Plus className="h-4 w-4 text-amber-500" />}>
            Add Activity
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAddSection('stay')} leftIcon={<Plus className="h-4 w-4 text-emerald-500" />}>
            Add Hotel / Stay
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAddSection('travel')} leftIcon={<Plus className="h-4 w-4 text-blue-500" />}>
            Add Flight / Train
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleAddSection('other')} leftIcon={<Plus className="h-4 w-4 text-purple-500" />}>
            Add Other Block
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link to="/trips">
          <Button variant="ghost">Back to My Trips</Button>
        </Link>

        <Button variant="secondary" size="lg" onClick={handleFinish} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Finish & Inspect Budget
        </Button>
      </div>
    </div>
  );
};
