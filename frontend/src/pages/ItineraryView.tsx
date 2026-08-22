import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ItineraryResponse } from '../types';
import { itineraryApi } from '../api/itinerary';
import { sharingApi } from '../api/sharing';
import { communityApi } from '../api/community';
import { BudgetOverview } from '../components/budget/BudgetOverview';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skeleton } from '../components/common/Skeleton';
import { Price } from '../components/common/Price';
import { useUIStore } from '../store/uiStore';
import { EditTripModal } from '../components/trips/EditTripModal';
import { DownloadPlanButton } from '../components/trip/DownloadPlanButton';
import { TripMobileActionBar } from '../components/trip/TripMobileActionBar';
import { TripRouteMap } from '../components/trip/TripRouteMap';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import { AddItineraryExpenseModal } from '../components/expenses/AddItineraryExpenseModal';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ItineraryExpensePanel } from '../components/expenses/ItineraryExpensePanel';
import { TripSpendingTracker } from '../components/expenses/TripSpendingTracker';
import { expensesApi } from '../api/expenses';
import { tripsApi } from '../api/trips';
import { City, Expense, Stop, TripSection } from '../types';
import { formatTripDuration, tripDurationDays } from '../utils/validation';
import { stopsApi } from '../api/stops';
import { citiesApi } from '../api/cities';
import { ItineraryCityTimeline } from '../components/trip/ItineraryCityTimeline';
import {
  Calendar,
  Share2,
  Edit3,
  Clock,
  Plus,
  Users,
  IndianRupee,
  Copy,
} from 'lucide-react';

export const ItineraryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useUIStore();

  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget'>('timeline');
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2]); // Expand Day 1 and 2 by default
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [itineraryExpenseOpen, setItineraryExpenseOpen] = useState(false);
  const [itineraryExpenseType, setItineraryExpenseType] = useState<'stay' | 'travel'>('stay');
  const [itineraryExpenseStopId, setItineraryExpenseStopId] = useState<number | undefined>();
  const [itineraryExpenseScope, setItineraryExpenseScope] = useState<'city' | 'trip'>('city');
  const [editingItinerarySection, setEditingItinerarySection] = useState<TripSection | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [cityIdByName, setCityIdByName] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await itineraryApi.getItinerary(id || '1');
        setItinerary(res);
        if (res.days.length > 0) {
          setExpandedDays([res.days[0].day_number]);
        }
        try {
          const cityList = await citiesApi.getCities();
          setCities(cityList);
          if (id) {
            try {
              const stopsList = await stopsApi.getStops(id);
              setStops(stopsList);
              const cityNameById = new Map(cityList.map((c) => [c.id, c.name.toLowerCase()]));
              const map: Record<string, number> = {};
              for (const stop of stopsList) {
                const name = cityNameById.get(stop.city_id);
                if (name) map[name] = stop.city_id;
              }
              setCityIdByName(map);
            } catch {
              /* optional */
            }
          }
        } catch {
          /* optional */
        }
      } catch (err) {
        console.error('Failed to load itinerary:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const reloadItinerary = async () => {
    if (!id) return;
    const res = await itineraryApi.getItinerary(id);
    setItinerary(res);
  };

  const loadExpenses = async () => {
    if (!id) return;
    setExpensesLoading(true);
    try {
      const rows = await expensesApi.listExpenses(id);
      setExpenses(rows);
    } catch {
      /* optional */
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteExpense = async (expenseId: number) => {
    if (!id) return;
    try {
      await expensesApi.deleteExpense(id, expenseId);
      showToast('success', 'Expense removed.');
      await loadExpenses();
      await reloadItinerary();
    } catch {
      showToast('error', 'Could not delete expense.');
    }
  };

  const handleExpenseSaved = async () => {
    await loadExpenses();
    await reloadItinerary();
  };

  const toggleDayExpansion = (dayNumber: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
    );
  };

  const handleShareTrip = async () => {
    try {
      const res = await sharingApi.shareTrip(id || '1');
      setShareUrl(res.share_url);
      setIsShareModalOpen(true);
    } catch {
      showToast('error', 'Could not generate share link.');
    }
  };

  const handleShareToCommunity = async () => {
    try {
      await communityApi.shareItinerary({ trip_id: Number(id) });
      showToast('success', 'Itinerary published to community!');
      navigate('/community');
    } catch {
      showToast('error', 'Could not share to community. Are you signed in?');
    }
  };

  const handleItineraryExpenseSaved = async () => {
    await reloadItinerary();
    await loadExpenses();
  };

  const openItineraryExpense = (
    type: 'stay' | 'travel',
    options?: { stopId?: number; scope?: 'city' | 'trip' }
  ) => {
    setEditingItinerarySection(null);
    setItineraryExpenseType(type);
    setItineraryExpenseScope(options?.scope ?? (options?.stopId ? 'city' : 'trip'));
    setItineraryExpenseStopId(options?.stopId);
    setItineraryExpenseOpen(true);
  };

  const openEditItineraryExpense = (section: TripSection) => {
    setEditingItinerarySection(section);
    setItineraryExpenseType(section.type === 'travel' ? 'travel' : 'stay');
    setItineraryExpenseScope(section.budget_allocation === 'trip_total' ? 'trip' : 'city');
    setItineraryExpenseStopId(section.stop_id);
    setItineraryExpenseOpen(true);
  };

  const closeItineraryExpenseModal = () => {
    setItineraryExpenseOpen(false);
    setEditingItinerarySection(null);
  };

  const handleAddExpense = () => {
    setExpenseModalOpen(true);
  };

  const handleDuplicateTrip = async () => {
    if (!id) return;
    setDuplicating(true);
    try {
      const res = await tripsApi.duplicateTrip(id);
      showToast('success', 'Trip duplicated!');
      navigate(`/trips/${res.trip_id}/confirmed`);
    } catch {
      showToast('error', 'Could not duplicate trip.');
    } finally {
      setDuplicating(false);
    }
  };

  if (loading || !itinerary) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  const { trip, days, budget } = itinerary;
  const durationLabel = formatTripDuration(trip.start_date, trip.end_date);
  const totalTripDays = tripDurationDays(trip.start_date, trip.end_date);

  const resolveCityId = (day: (typeof days)[number]) =>
    day.city_id ?? (day.city_name ? cityIdByName[day.city_name.toLowerCase()] : undefined);

  return (
    <div className="space-y-8 pb-28 sm:pb-16">
      <EditTripModal
        trip={trip}
        isOpen={editTripOpen}
        onClose={() => setEditTripOpen(false)}
        onSaved={async (updated) => {
          showToast('success', 'Trip updated — stops and expenses rearranged to fit new dates.');
          const tripId = id || trip.id;
          const res = await itineraryApi.getItinerary(tripId);
          setItinerary(res);
          try {
            const stopsList = await stopsApi.getStops(tripId);
            setStops(stopsList);
          } catch {
            /* optional */
          }
          await loadExpenses();
        }}
      />
      {/* Hero Header for Itinerary (Screen 9 wireframe) */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[260px] flex flex-col justify-end p-6 sm:p-8 shadow-card">
        <img
          src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80'}
          alt={trip.name}
          className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="success" size="md">
              {trip.status.toUpperCase()}
            </Badge>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <DownloadPlanButton tripId={trip.id} variant="glass" size="sm" />
              <Button
                variant="glass"
                size="sm"
                isLoading={duplicating}
                onClick={handleDuplicateTrip}
                leftIcon={<Copy className="h-4 w-4" />}
              >
                Duplicate
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={handleShareToCommunity}
                leftIcon={<Users className="h-4 w-4" />}
              >
                Share to Community
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={handleShareTrip}
                leftIcon={<Share2 className="h-4 w-4" />}
              >
                Copy Link
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setEditTripOpen(true)}
                leftIcon={<Edit3 className="h-4 w-4" />}
              >
                Edit Trip
              </Button>
              <Link to={`/trips/${trip.id}/build`}>
                <Button
                  variant="glass"
                  size="sm"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                >
                  Edit Sections
                </Button>
              </Link>
              <Link to={`/trips/${trip.id}/calendar`}>
                <Button
                  variant="glass"
                  size="sm"
                  leftIcon={<Calendar className="h-4 w-4" />}
                >
                  Calendar
                </Button>
              </Link>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {trip.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-400" />
              {trip.start_date} – {trip.end_date}
              <span className="text-brand-300">({durationLabel})</span>
            </span>
            <span className="flex items-center gap-1.5">
              Total:{' '}
              <Price amount={budget.grand_total ?? budget.total_budget} zeroAsFree={false} /> (
              <Price amount={budget.general_spent ?? budget.total_spent} zeroAsFree={false} /> general)
            </span>
            <span>{totalTripDays} Itinerary Days</span>
          </div>
        </div>
      </div>

      <TripRouteMap tripId={trip.id} />

      <TripSpendingTracker
        budget={budget}
        expenses={expenses}
        loading={expensesLoading}
        onLogExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        onViewAll={() => setActiveTab('budget')}
      />

      <ItineraryExpensePanel
        days={days}
        stops={stops}
        cities={cities}
        tripStart={trip.start_date}
        tripEnd={trip.end_date}
        onAddStayTrip={() => openItineraryExpense('stay', { scope: 'trip' })}
        onAddTransportTrip={() => openItineraryExpense('travel', { scope: 'trip' })}
        onAddStayCity={(stopId) => openItineraryExpense('stay', { stopId, scope: 'city' })}
        onAddTransportCity={(stopId) => openItineraryExpense('travel', { stopId, scope: 'city' })}
        onEditSection={openEditItineraryExpense}
      />

      {/* Navigation Tabs (Timeline vs Budget) */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/80 shadow-soft">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Timeline & Activities</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'budget'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <IndianRupee className="h-4 w-4" />
            <span>Budget & Expense Analytics</span>
          </button>
        </div>

        {activeTab === 'budget' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Log Expense
          </Button>
        )}
      </div>

      {/* TAB 1: City-grouped timeline with images */}
      {activeTab === 'timeline' && (
        <ItineraryCityTimeline
          days={days}
          cities={cities}
          variant="interactive"
          expandedDays={expandedDays}
          onToggleDay={toggleDayExpansion}
          resolveExploreCityId={resolveCityId}
        />
      )}

      {/* TAB 2: Budget Breakdown & Overbudget Alerts (Screen 9 wireframe) */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <BudgetOverview budget={budget} />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">All logged expenses</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddExpense}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Log Expense
              </Button>
            </div>
            <ExpenseList
              expenses={expenses}
              loading={expensesLoading}
              onDelete={handleDeleteExpense}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Your Public Itinerary"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Anyone with this link can view your itinerary and copy it to their personal GlobeTrotter account.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                showToast('success', 'Share URL copied to clipboard!');
              }}
            >
              Copy
            </Button>
          </div>
        </div>
      </Modal>

      <TripMobileActionBar tripId={trip.id} onShare={handleShareTrip} />

      <AddExpenseModal
        tripId={trip.id}
        tripStartDate={trip.start_date}
        tripEndDate={trip.end_date}
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={handleExpenseSaved}
      />

      <AddItineraryExpenseModal
        tripId={trip.id}
        stops={stops}
        cities={cities}
        tripStart={trip.start_date}
        tripEnd={trip.end_date}
        isOpen={itineraryExpenseOpen}
        onClose={closeItineraryExpenseModal}
        onSaved={handleItineraryExpenseSaved}
        defaultType={itineraryExpenseType}
        defaultStopId={itineraryExpenseStopId}
        defaultScope={itineraryExpenseScope}
        editSection={editingItinerarySection}
      />
    </div>
  );
};
