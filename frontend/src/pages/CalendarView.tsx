import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trip, ItineraryDay, TripSection } from '../types';
import { tripsApi } from '../api/trips';
import { itineraryApi } from '../api/itinerary';
import { sectionsApi } from '../api/sections';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { HolidayCalendar } from '../components/holidays/HolidayCalendar';
import { LongWeekendPanel } from '../components/holidays/LongWeekendPanel';
import { PlanTripPromptModal } from '../components/holidays/PlanTripPromptModal';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import { LongWeekend } from '../utils/holidays';
import { Calendar, Plus, ArrowRight, Sparkles } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planContext, setPlanContext] = useState<{
    startDate?: string;
    endDate?: string;
    longWeekend?: LongWeekend | null;
  }>({});

  useEffect(() => {
    const loadCalendarData = async () => {
      setLoading(true);
      try {
        const tripsData = await tripsApi.getTrips({ sort: 'start_date', limit: 20 });
        setTrips(tripsData);

        const resolvedTripId = id || String(tripsData[0]?.id || '');
        if (!resolvedTripId) {
          setActiveTrip(null);
          setItineraryDays([]);
          return;
        }

        const [tripData, itineraryData] = await Promise.all([
          tripsApi.getTrip(resolvedTripId),
          itineraryApi.getItinerary(resolvedTripId),
        ]);
        setActiveTrip(tripData);
        setItineraryDays(itineraryData.days);
      } catch (err) {
        console.error('Failed to load calendar events:', err);
        showToast('error', 'Failed to load calendar data.');
      } finally {
        setLoading(false);
      }
    };
    loadCalendarData();
  }, [id, showToast]);

  useEffect(() => {
    if (!loading && trips.length === 0 && !id) {
      const timer = window.setTimeout(() => {
        setPlanContext({});
        setPlanModalOpen(true);
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [loading, trips.length, id]);

  const handleReorderSections = async (_date: string, sections: TripSection[]) => {
    try {
      await Promise.all(
        sections.map((section) =>
          sectionsApi.updateSection(section.id, { order_index: section.order_index })
        )
      );
      showToast('success', 'Activity order updated.');
    } catch {
      showToast('error', 'Failed to save new activity order.');
    }
  };

  const openPlanModal = (opts: {
    startDate?: string;
    endDate?: string;
    longWeekend?: LongWeekend | null;
  }) => {
    setPlanContext(opts);
    setPlanModalOpen(true);
  };

  const tripId = id || activeTrip?.id;
  const hasTrips = trips.length > 0;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" />{' '}
            {hasTrips ? 'Trip Calendar / Timeline' : 'Holiday & Travel Calendar'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTrip ? activeTrip.name : 'Travel Calendar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {hasTrips
              ? 'Calendar grid and timeline with your trips, plus public holidays and long weekend suggestions.'
              : 'Browse public holidays and long weekends — plan getaways even before your first trip.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tripId && (
            <Link to={`/trips/${tripId}`}>
              <Button variant="outline" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View Itinerary
              </Button>
            </Link>
          )}
          <Link to="/trips/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Plan Trip
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full rounded-3xl" />
      ) : !hasTrips ? (
        <div className="space-y-8">
          <div className="rounded-2xl bg-gradient-to-r from-teal-50 to-brand-50 border border-teal-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">No trips planned yet</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Use the calendar below to spot holidays and long weekends, then start planning.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openPlanModal({})}
            >
              Plan your trip
            </Button>
          </div>

          <HolidayCalendar
            onDateSelect={(dateStr, _holiday, longWeekend) => {
              if (longWeekend) {
                openPlanModal({ longWeekend });
              } else {
                openPlanModal({ startDate: dateStr, endDate: dateStr });
              }
            }}
            onLongWeekendClick={(lw) => openPlanModal({ longWeekend: lw })}
          />

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
            <LongWeekendPanel onSelect={(lw) => openPlanModal({ longWeekend: lw })} />
          </div>
        </div>
      ) : (
        <>
          {!id && trips.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {trips.slice(0, 6).map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}/calendar`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    String(trip.id) === String(tripId)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'
                  }`}
                >
                  {trip.name}
                </Link>
              ))}
            </div>
          )}

          <CalendarGrid
            tripId={tripId}
            trips={trips}
            itineraryDays={itineraryDays}
            onReorderSections={handleReorderSections}
            showHolidays
            onPlanHoliday={(startDate, endDate, longWeekend) =>
              openPlanModal({ startDate, endDate, longWeekend })
            }
          />

          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
            <LongWeekendPanel
              compact
              limit={4}
              onSelect={(lw) => openPlanModal({ longWeekend: lw })}
            />
          </div>
        </>
      )}

      <PlanTripPromptModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        startDate={planContext.startDate}
        endDate={planContext.endDate}
        longWeekend={planContext.longWeekend}
        title="Plan your trip"
        subtitle={
          planContext.longWeekend
            ? undefined
            : 'Turn these dates into a multi-city itinerary with budgets and activities.'
        }
      />
    </div>
  );
};
