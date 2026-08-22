import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SharedTrip } from '../types';
import { sharingApi } from '../api/sharing';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { BudgetOverview } from '../components/budget/BudgetOverview';
import {
  Copy,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Compass,
  Plane,
  Home,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export const PublicTrip: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [sharedTrip, setSharedTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget'>('timeline');

  useEffect(() => {
    const loadSharedTrip = async () => {
      setLoading(true);
      try {
        const res = await sharingApi.getPublicTrip(slug || 'alpine-odyssey');
        setSharedTrip(res);
      } catch (err) {
        console.error('Failed to load shared trip:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSharedTrip();
  }, [slug]);

  const handleCopyTrip = async () => {
    if (!isAuthenticated) {
      showToast('info', 'Please sign in to clone this itinerary into your account.');
      navigate('/login', { state: { from: { pathname: `/t/${slug}` } } });
      return;
    }

    setIsCopying(true);
    try {
      const res = await sharingApi.copyPublicTrip(slug || 'sample');
      showToast('success', 'Trip cloned! Redirecting to your personal itinerary...');
      navigate(`/trips/${res.new_trip_id}`);
    } catch {
      showToast('error', 'Failed to copy trip.');
    } finally {
      setIsCopying(false);
    }
  };

  if (loading || !sharedTrip) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { trip, days, budget } = sharedTrip;

  return (
    <div className="space-y-8 pb-16">
      {/* Public Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[300px] flex flex-col justify-between p-6 sm:p-10 shadow-elevated">
        <img
          src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80'}
          alt={trip.name}
          className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        {/* Top Tag & Copy Button */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <Badge variant="info" size="md">
            PUBLIC SHARED ITINERARY
          </Badge>

          <Button
            variant="primary"
            size="lg"
            onClick={handleCopyTrip}
            isLoading={isCopying}
            leftIcon={<Copy className="h-5 w-5" />}
            className="shadow-lg shadow-brand-500/30"
          >
            Copy Trip to My Account
          </Button>
        </div>

        {/* Title & Stats */}
        <div className="relative z-10 space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            {trip.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-400" />
              {trip.start_date} – {trip.end_date}
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Allocated Budget: ${budget.total_budget.toLocaleString()}
            </span>
            <span>{days.length} Itinerary Days</span>
          </div>
        </div>
      </div>

      {/* Overview Callout */}
      <div className="p-5 rounded-2xl bg-brand-50/80 border border-brand-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Like this itinerary?</h4>
            <p className="text-xs text-slate-600">
              Click 'Copy Trip' to duplicate this entire schedule, modify dates, and customize activities.
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyTrip}
          leftIcon={<Copy className="h-4 w-4" />}
        >
          Clone Itinerary
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-soft">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Timeline View</span>
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'budget'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Budget Analytics</span>
        </button>
      </div>

      {/* Tab 1: Day Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {days.map((day) => (
            <div
              key={day.day_number}
              className="rounded-3xl bg-white border border-slate-200/80 shadow-soft p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                    D{day.day_number}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Day {day.day_number}: {day.date}
                    </h3>
                    {day.city_name && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-brand-500" />
                        {day.city_name}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  ${day.total_cost}
                </span>
              </div>

              <div className="space-y-3">
                {day.sections.map((section, idx) => (
                  <div
                    key={section.id || idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {section.type === 'travel' && <Plane className="h-4 w-4 text-blue-500" />}
                        {section.type === 'stay' && <Home className="h-4 w-4 text-emerald-500" />}
                        {section.type === 'activity' && <Compass className="h-4 w-4 text-amber-500" />}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{section.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-slate-700">${section.budget}</span>
                    </div>
                    {section.notes && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                        {section.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Budget */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <BudgetOverview budget={budget} />
        </div>
      )}
    </div>
  );
};

