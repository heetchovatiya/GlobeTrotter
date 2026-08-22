import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trip, ItineraryDay } from '../types';
import { tripsApi } from '../api/trips';
import { itineraryApi } from '../api/itinerary';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Calendar, Plus, MapPin, ArrowRight, Layers } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCalendarData = async () => {
      setLoading(true);
      try {
        const [tripsData, itineraryData] = await Promise.all([
          tripsApi.getTrips(),
          itineraryApi.getItinerary(id || '1'),
        ]);
        setTrips(tripsData);
        setItineraryDays(itineraryData.days);
      } catch (err) {
        console.error('Failed to load calendar events:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCalendarData();
  }, [id]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header (Screen 11 wireframe) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" /> Screen 11 Calendar Timeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interactive Travel Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            View your journey across time, check multi-day trip spans, and inspect scheduled activities by date.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/trips/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
              Plan Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Calendar View Component */}
      {loading ? (
        <Skeleton className="h-96 w-full rounded-3xl" />
      ) : (
        <CalendarGrid trips={trips} itineraryDays={itineraryDays} />
      )}
    </div>
  );
};

