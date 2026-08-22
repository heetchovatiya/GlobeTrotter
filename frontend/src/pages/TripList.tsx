import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trip, TripStatus } from '../types';
import { tripsApi } from '../api/trips';
import { TripCard } from '../components/trips/TripCard';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { Plus, Search, Filter, SlidersHorizontal, MapPin } from 'lucide-react';

export const TripList: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | TripStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'start_date' | 'name' | 'budget'>('start_date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      try {
        const data = await tripsApi.getTrips();
        setTrips(data);
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  const tabs: { label: string; value: 'all' | TripStatus }[] = [
    { label: 'All Itineraries', value: 'all' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
  ];

  const filteredTrips = trips
    .filter((trip) => {
      if (activeTab !== 'all' && trip.status !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          trip.name.toLowerCase().includes(q) ||
          (trip.description && trip.description.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'budget') return (b.total_budget || 0) - (a.total_budget || 0);
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });

  return (
    <div className="space-y-8 pb-16">
      {/* Header with Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Trips & Itineraries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage all your ongoing, upcoming, and past travel adventures.
          </p>
        </div>

        <Link to="/trips/new">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} className="shadow-md shadow-brand-500/20">
            Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const count =
              tab.value === 'all'
                ? trips.length
                : trips.filter((t) => t.status === tab.value).length;
            const isSelected = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trips..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-900 border border-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="start_date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="budget">Sort by Budget</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Listing Grid / Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-300 p-8 space-y-4">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No itineraries found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No itineraries matching "${searchQuery}". Try a different keyword.`
              : 'You have no trips in this category yet. Create your first itinerary!'}
          </p>
          <Link to="/trips/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Create New Trip
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

