import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { City, Trip } from '../types';
import { citiesApi } from '../api/cities';
import { tripsApi } from '../api/trips';
import { CityCard } from '../components/search/CityCard';
import { TripCard } from '../components/trips/TripCard';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Search, Plus, Compass, Sparkles, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cities, trips] = await Promise.all([
          citiesApi.getCities({ sort: 'popularity', limit: 4 }),
          tripsApi.getTrips({ sort: 'recent' }),
        ]);
        setPopularCities(cities);
        setRecentTrips(trips);
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

  return (
    <div className="space-y-10 pb-16">
      {/* Banner Image / Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white min-h-[380px] sm:min-h-[460px] flex items-center shadow-elevated">
        {/* Background photo with gradient overlays */}
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
            Create multi-day custom routes, organize flights and stays, track daily budgets, and share itineraries with friends.
          </p>

          {/* Quick Search Bar */}
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

      {/* Quick Action CTA Bar */}
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

      {/* Top Regional Selections */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Top Regional Selections
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
            {[1, 2, 3, 4].map((i) => (
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

      {/* Previous / Active Trips */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Your Itineraries & Trips
            </h2>
            <p className="text-xs text-slate-500">
              Resume building or inspect day-by-day schedules and expenses
            </p>
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
        ) : recentTrips.length > 0 ? (
          <div className="space-y-4">
            {recentTrips.slice(0, 3).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-3xl bg-white border border-dashed border-slate-300 p-8 space-y-3">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No trips created yet</h3>
            <p className="text-xs text-slate-500">Start by creating your first trip itinerary!</p>
            <Link to="/trips/new">
              <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                Create Trip
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

