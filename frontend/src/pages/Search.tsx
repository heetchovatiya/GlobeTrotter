import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, City, ActivityType } from '../types';
import { activitiesApi } from '../api/activities';
import { citiesApi } from '../api/cities';
import { ActivityCard } from '../components/search/ActivityCard';
import { CityCard } from '../components/search/CityCard';
import { useFormatPrice, Price } from '../components/common/Price';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { Badge } from '../components/common/Badge';
import { useUIStore } from '../store/uiStore';
import {
  Search as SearchIcon,
  Compass,
  MapPin,
  Clock,
  Plus,
  Check,
} from 'lucide-react';

export const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useUIStore();
  const formatPrice = useFormatPrice();

  const [activeTab, setActiveTab] = useState<'activities' | 'cities'>('activities');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'all');
  const [selectedCityId, setSelectedCityId] = useState<string>(searchParams.get('city_id') || 'all');
  const [maxCost, setMaxCost] = useState<number>(300);
  const [maxDuration, setMaxDuration] = useState<number>(480);
  const [sortBy, setSortBy] = useState<string>('popularity');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedActivityIds, setAddedActivityIds] = useState<number[]>([]);
  const [quickViewActivity, setQuickViewActivity] = useState<Activity | null>(null);

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
            max_duration_mins: maxDuration,
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

    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedType, selectedCityId, maxCost, maxDuration, sortBy]);

  const handleAddActivity = (activity: Activity) => {
    const isRemoving = addedActivityIds.includes(activity.id);
    setAddedActivityIds((prev) =>
      isRemoving ? prev.filter((id) => id !== activity.id) : [...prev, activity.id]
    );
    showToast(
      'success',
      isRemoving
        ? `Removed "${activity.name}" from your plan.`
        : `Added "${activity.name}" to your active plan.`
    );
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} minutes`;
    const hours = (mins / 60).toFixed(1);
    return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} hours`;
  };

  const activityTypes: { label: string; value: string }[] = [
    { label: 'All Categories', value: 'all' },
    { label: 'Sightseeing', value: 'sightseeing' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Food & Wine', value: 'food' },
    { label: 'Culture & Art', value: 'culture' },
    { label: 'Nightlife', value: 'nightlife' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Activity Search
        </h1>
        <p className="text-sm text-slate-500">
          Browse and select things to do in each stop, filtered by interest, cost, and duration.
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-5">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Type / Interest
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

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Max Cost</span>
              <span className="text-emerald-600">{formatPrice(maxCost)}</span>
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

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Max Duration</span>
              <span className="text-brand-600">{Math.round(maxDuration / 60)}h</span>
            </div>
            <input
              type="range"
              min="30"
              max="480"
              step="30"
              value={maxDuration}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
              className="w-full accent-brand-600 mt-2"
            />
          </div>

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
              <option value="duration">Duration: Shortest</option>
              <option value="duration_desc">Duration: Longest</option>
            </select>
          </div>
        </div>
      </div>

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
                onQuickView={setQuickViewActivity}
                isAdded={addedActivityIds.includes(activity.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-200 p-8">
            <Compass className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No activities matched your filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try raising the max budget or duration, or clearing search terms.
            </p>
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

      <Modal
        isOpen={!!quickViewActivity}
        onClose={() => setQuickViewActivity(null)}
        title={quickViewActivity?.name}
        maxWidth="lg"
      >
        {quickViewActivity && (
          <div className="space-y-4">
            <img
              src={quickViewActivity.image_url}
              alt={quickViewActivity.name}
              className="w-full h-56 object-cover rounded-2xl"
            />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="info">{quickViewActivity.type}</Badge>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="h-4 w-4" />
                {formatDuration(quickViewActivity.duration_mins)}
              </span>
              <span className="font-semibold text-slate-800">
                {quickViewActivity.cost === 0 ? 'Free' : <Price amount={quickViewActivity.cost} />}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{quickViewActivity.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setQuickViewActivity(null)}>
                Close
              </Button>
              <Button
                variant={addedActivityIds.includes(quickViewActivity.id) ? 'outline' : 'primary'}
                onClick={() => handleAddActivity(quickViewActivity)}
                leftIcon={
                  addedActivityIds.includes(quickViewActivity.id) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )
                }
              >
                {addedActivityIds.includes(quickViewActivity.id) ? 'Remove from Plan' : 'Add to Plan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
