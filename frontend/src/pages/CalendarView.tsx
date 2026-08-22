import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trip, ItineraryDay, TripSection } from '../types';
import { tripsApi } from '../api/trips';
import { itineraryApi } from '../api/itinerary';
import { sectionsApi } from '../api/sections';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import { Calendar, Plus, ArrowRight } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);

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

  const tripId = id || activeTrip?.id;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" /> Trip Calendar / Timeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTrip ? activeTrip.name : 'Travel Calendar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Calendar grid and vertical timeline with expandable days, drag-to-reorder activities, and
            quick editing.
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

      {!loading && trips.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-300">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No trips to display</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create a trip to see it on the calendar.</p>
          <Link to="/trips/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Create Trip
            </Button>
          </Link>
        </div>
      ) : loading ? (
        <Skeleton className="h-96 w-full rounded-3xl" />
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
          />
        </>
      )}
    </div>
  );
};
