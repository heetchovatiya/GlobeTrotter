import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { City, Trip, BudgetSummary } from '../types';
import { citiesApi } from '../api/cities';
import { tripsApi } from '../api/trips';
import { budgetApi } from '../api/budget';
import { CityCard } from '../components/search/CityCard';
import { TripCard } from '../components/trips/TripCard';
import { LongWeekendPanel } from '../components/holidays/LongWeekendPanel';
import { PlanTripPromptModal } from '../components/holidays/PlanTripPromptModal';
import { Button } from '../components/common/Button';
import { Price } from '../components/common/Price';
import { Skeleton } from '../components/common/Skeleton';
import { LongWeekend } from '../utils/holidays';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  MapPin,
  ArrowRight,
  Wallet,
  TrendingUp,
  PiggyBank,
  CalendarDays,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TripBudgetHighlight {
  trip: Trip;
  budget: BudgetSummary;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [previousTrips, setPreviousTrips] = useState<Trip[]>([]);
  const [budgetHighlights, setBudgetHighlights] = useState<TripBudgetHighlight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedWeekend, setSelectedWeekend] = useState<LongWeekend | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cities = await citiesApi.getCities({ sort: 'popularity', limit: 8 });
        setPopularCities(cities);

        if (useAuthStore.getState().isAuthenticated) {
          const [upcoming, ongoing, completed] = await Promise.all([
            tripsApi.getTrips({ status: 'upcoming', sort: 'start_date', limit: 5 }),
            tripsApi.getTrips({ status: 'ongoing', sort: 'start_date', limit: 3 }),
            tripsApi.getTrips({ status: 'completed', sort: 'start_date_desc', limit: 5 }),
          ]);

          const activeTrips = [...ongoing, ...upcoming].slice(0, 5);
          setUpcomingTrips(activeTrips);
          setPreviousTrips(completed);

          const highlightTrips = activeTrips.slice(0, 3);
          const highlights = await Promise.all(
            highlightTrips.map(async (trip) => {
              try {
                const budget = await budgetApi.getBudget(trip.id);
                return { trip, budget };
              } catch {
                return null;
              }
            })
          );
          setBudgetHighlights(highlights.filter(Boolean) as TripBudgetHighlight[]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const firstName = user?.name?.split(' ')[0];
  const totalPlanned = budgetHighlights.reduce((sum, item) => sum + item.budget.total_budget, 0);
  const totalSpent = budgetHighlights.reduce((sum, item) => sum + item.budget.total_spent, 0);
  const totalRemaining = budgetHighlights.reduce((sum, item) => sum + item.budget.remaining_budget, 0);

  return (
    <div className="space-y-10 pb-16">
      {isAuthenticated && user && (
        <section className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 text-white px-6 py-5 shadow-soft">
          <p className="text-sm text-brand-100">Welcome back</p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {firstName ? `Hello, ${firstName}!` : `Hello, ${user.name}!`}
          </h2>
          <p className="text-sm text-brand-100 mt-1">
            {upcomingTrips.length > 0
              ? `You have ${upcomingTrips.length} upcoming or active trip${upcomingTrips.length === 1 ? '' : 's'} to plan.`
              : 'Ready to plan your next adventure?'}
          </p>
        </section>
      )}

      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white min-h-[380px] sm:min-h-[460px] flex items-center shadow-elevated">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&auto=format&fit=crop&q=80"
          alt="GlobeTrotter Banner"
          className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 py-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 border border-brand-400/30 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-brand-300 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-brand-400" />
            <span>Smart Multi-City Itinerary Architect</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Design Your Next Adventure with <span className="text-brand-400">GlobeTrotter</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create multi-day custom routes, organize flights and stays, track daily budgets, and share
            itineraries with friends.
          </p>

          <form
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/40"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to next? (e.g. Kyoto, Alps, Rome, Paragliding...)"
                className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="sm:w-auto w-full shadow-md shadow-brand-500/30"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Explore
            </Button>
          </form>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ready to construct a multi-section itinerary?
            </h3>
            <p className="text-xs text-slate-500">
              Define travel legs, hotel stays, tours, and real-time expense budgets.
            </p>
          </div>
        </div>

        <Link to="/trips/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
            Plan New Trip
          </Button>
        </Link>
      </section>

      <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Plan around holidays</h2>
              <p className="text-xs text-slate-500">
                Upcoming long weekends based on Indian public holidays
              </p>
            </div>
          </div>
          <Link to="/calendar">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Full calendar
            </Button>
          </Link>
        </div>
        <LongWeekendPanel
          compact
          limit={4}
          onSelect={(lw) => {
            setSelectedWeekend(lw);
            setPlanModalOpen(true);
          }}
        />
      </section>

      {isAuthenticated && budgetHighlights.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Budget Highlights
            </h2>
            <p className="text-xs text-slate-500">
              Planned vs. spent across your active and upcoming trips
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Wallet className="h-4 w-4 text-brand-500" />
                Total Planned
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                <Price amount={totalPlanned} />
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Total Spent
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                <Price amount={totalSpent} />
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <PiggyBank className="h-4 w-4 text-emerald-500" />
                Remaining
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                <Price amount={totalRemaining} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgetHighlights.map(({ trip, budget }) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft hover:shadow-card transition-shadow"
              >
                <p className="text-sm font-bold text-slate-900 line-clamp-1">{trip.name}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Planned</span>
                  <Price amount={budget.total_budget} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Remaining</span>
                  <Price amount={budget.remaining_budget} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Recommended Destinations
            </h2>
            <p className="text-xs text-slate-500">
              Curated destinations with high traveler ratings and unforgettable experiences
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCities.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Upcoming Trips
              </h2>
              <p className="text-xs text-slate-500">Active and planned itineraries you can resume</p>
            </div>
            <Link
              to="/trips"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage trips</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <div className="space-y-4">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-3xl bg-white border border-dashed border-slate-300 p-8 space-y-3">
              <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No upcoming trips yet</h3>
              <p className="text-xs text-slate-500">Start by creating your first trip itinerary!</p>
              <Link to="/trips/new">
                <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                  Create Trip
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}

      {isAuthenticated && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Previous Trips
              </h2>
              <p className="text-xs text-slate-500">Completed journeys you can revisit or share</p>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 w-64 flex-shrink-0" />
              ))}
            </div>
          ) : previousTrips.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {previousTrips.map((trip) => (
                <div key={trip.id} className="w-64 flex-shrink-0 snap-start">
                  <TripCard trip={trip} compact />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-6 text-center text-sm text-slate-500">
              Completed trips will appear here after your journeys end.
            </div>
          )}
        </section>
      )}

      <PlanTripPromptModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        longWeekend={selectedWeekend}
      />
    </div>
  );
};
