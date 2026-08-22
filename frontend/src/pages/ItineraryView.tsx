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
import { ExpenseList } from '../components/expenses/ExpenseList';
import { expensesApi } from '../api/expenses';
import { tripsApi } from '../api/trips';
import { Expense } from '../types';
import { formatTripDuration } from '../utils/validation';
import {
  Calendar,
  Share2,
  Edit3,
  MapPin,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Plane,
  Home,
  Compass,
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await itineraryApi.getItinerary(id || '1');
        setItinerary(res);
        if (res.days.length > 0) {
          setExpandedDays([res.days[0].day_number]);
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
    if (activeTab === 'budget' && id) {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

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

  return (
    <div className="space-y-8 pb-28 sm:pb-16">
      <EditTripModal
        trip={trip}
        isOpen={editTripOpen}
        onClose={() => setEditTripOpen(false)}
        onSaved={async (updated) => {
          setItinerary((prev) =>
            prev ? { ...prev, trip: { ...prev.trip, ...updated } } : prev
          );
          showToast('success', 'Trip details updated.');
          const res = await itineraryApi.getItinerary(id || trip.id);
          setItinerary(res);
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
              Budget: <Price amount={budget.total_budget} /> (
              <Price amount={budget.total_spent} /> spent)
            </span>
            <span>{days.length} Itinerary Days</span>
          </div>
        </div>
      </div>

      <TripRouteMap tripId={trip.id} />

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

      {/* TAB 1: Day-by-Day Timeline View (Screen 9 wireframe) */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {days.map((day) => {
            const isExpanded = expandedDays.includes(day.day_number);

            return (
              <div
                key={day.day_number}
                className="rounded-3xl bg-white border border-slate-200/80 shadow-soft overflow-hidden transition-all"
              >
                {/* Day Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleDayExpansion(day.day_number)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-sm font-extrabold text-brand-700">
                      D{day.day_number}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Day {day.day_number}: {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </h3>
                      {day.city_name && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="h-3 w-3 text-brand-500" />
                          {day.city_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Price amount={day.total_cost} />
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Day Activities / Sections List */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 space-y-4 animate-fade-in">
                    {day.sections.map((section, idx) => (
                      <div
                        key={section.id || idx}
                        className="rounded-2xl bg-slate-50/80 border border-slate-200/60 p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {section.type === 'travel' && <Plane className="h-4 w-4 text-blue-500" />}
                            {section.type === 'stay' && <Home className="h-4 w-4 text-emerald-500" />}
                            {section.type === 'activity' && <Compass className="h-4 w-4 text-amber-500" />}
                            <h4 className="text-sm font-bold text-slate-900">{section.title}</h4>
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            <Price amount={section.budget} />
                          </span>
                        </div>

                        {section.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                            {section.notes}
                          </p>
                        )}

                        {/* Sub-activities timeline */}
                        {section.activities && section.activities.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/60">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Scheduled Activities
                            </span>
                            {section.activities.map((act) => (
                              <div
                                key={act.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  {act.scheduled_time && (
                                    <span className="font-bold text-brand-600">
                                      {act.scheduled_time}
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-800">
                                    {act.custom_label || act.activity?.name}
                                  </span>
                                </div>
                                <span className="font-medium text-slate-500">
                                  <Price amount={act.cost_override ?? act.activity?.cost ?? 0} />
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Budget Breakdown & Overbudget Alerts (Screen 9 wireframe) */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <BudgetOverview budget={budget} />
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Manual expenses</h3>
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
    </div>
  );
};
