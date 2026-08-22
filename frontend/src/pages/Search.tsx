import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, City, ActivityType } from '../types';
import { activitiesApi } from '../api/activities';
import { citiesApi } from '../api/cities';
import { ActivityCard } from '../components/search/ActivityCard';
import { CityCard } from '../components/search/CityCard';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import {
  Search as SearchIcon,
  Filter,
  SlidersHorizontal,
  Compass,
  MapPin,
  Sparkles,
  Check,
} from 'lucide-react';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'activities' | 'cities'>('activities');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'all');
  const [selectedCityId, setSelectedCityId] = useState<string>(searchParams.get('city_id') || 'all');
  const [maxCost, setMaxCost] = useState<number>(300);
  const [sortBy, setSortBy] = useState<string>('popularity');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedActivityIds, setAddedActivityIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [citiesData, activitiesData] = await Promise.all([
          citiesApi.getCities({
            q: query || undefined,
            sort: sortBy === 'popularity' ? 'popularity' : undefined,
          }),
          activitiesApi.getActivities({
            q: query || undefined,
            city_id: selectedCityId !== 'all' ? Number(selectedCityId) : undefined,
            type: selectedType !== 'all' ? (selectedType as ActivityType) : undefined,
            max_cost: maxCost,
            sort: sortBy,
          }),
        ]);
        setCities(citiesData);
        setActivities(activitiesData);
      } catch (err) {
        console.error('Failed to load search results:', err);
      } finally {
        setLoading(false);
      }
    };

    // 300ms debounce as required in MVP Plan
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedType, selectedCityId, maxCost, sortBy]);

  const handleAddActivity = (activity: Activity) => {
    setAddedActivityIds((prev) =>
      prev.includes(activity.id) ? prev.filter((id) => id !== activity.id) : [...prev, activity.id]
    );
    showToast('success', `Added "${activity.name}" to your active plan.`);
  };

  const activityTypes: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'all' },
    { label: '🎯 Sightseeing', value: 'sightseeing' },
    { label: '🧗 Adventure', value: 'adventure' },
    { label: '🍷 Food & Wine', value: 'food' },
    { label: '🏛️ Culture & Art', value: 'culture' },
    { label: '🌙 Nightlife', value: 'nightlife' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Cities & Curated Activities
        </h1>
        <p className="text-sm text-slate-500">
          Discover verified adventures, culinary tastings, landmarks, and destinations worldwide.
        </p>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-5">
        {/* Search Bar + Tab Switcher */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords: 'Paragliding', 'Temple', 'Tapas', 'Kyoto'..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'activities'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activities ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cities'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Destinations ({cities.length})
            </button>
          </div>
        </div>

        {/* Filter Badges & Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          {/* Category Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {activityTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* City / Destination Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Destination City
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Destinations</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Range Filter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Max Budget</span>
              <span className="text-emerald-600">${maxCost}</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={maxCost}
              onChange={(e) => setMaxCost(Number(e.target.value))}
              className="w-full accent-brand-600 mt-2"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="cost_asc">Cost: Low to High</option>
              <option value="cost_desc">Cost: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : activeTab === 'activities' ? (
        activities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onAdd={handleAddActivity}
                isAdded={addedActivityIds.includes(activity.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-200 p-8">
            <Compass className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No activities matched your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try raising the max budget or clearing search terms.</p>
          </div>
        )
      ) : cities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-200 p-8">
          <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No destinations found</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for another country or region.</p>
        </div>
      )}
    </div>
  );
};

