import React, { useEffect, useState } from 'react';
import { AdminAnalytics } from '../types';
import { adminApi } from '../api/admin';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useFormatPrice } from '../components/common/Price';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import { AdminUsersSection } from '../components/admin/AdminUsersSection';
import { AdminCitiesSection } from '../components/admin/AdminCitiesSection';
import { AdminActivitiesSection } from '../components/admin/AdminActivitiesSection';
import { AdminCommunitySection } from '../components/admin/AdminCommunitySection';
import { AdminTemplatesSection } from '../components/admin/AdminTemplatesSection';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  MapPin,
  Compass,
  LayoutDashboard,
  Building2,
  Sparkles,
  MessageSquare,
  Route,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'cities' | 'activities' | 'community' | 'templates';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'users', label: 'Manage Users', icon: <Users className="h-4 w-4" /> },
  { id: 'cities', label: 'Manage Cities', icon: <Building2 className="h-4 w-4" /> },
  { id: 'activities', label: 'Manage Activities', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'community', label: 'Community', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'templates', label: 'Tour Templates', icon: <Route className="h-4 w-4" /> },
];

export const AdminPanel: React.FC = () => {
  const { showToast } = useUIStore();
  const formatPrice = useFormatPrice();
  const [tab, setTab] = useState<AdminTab>('users');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab !== 'overview') return;
    const load = async () => {
      setLoading(true);
      try {
        setAnalytics(await adminApi.getAnalytics());
      } catch {
        showToast('error', 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, showToast]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-elevated">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage users, cities, activities, community posts, tour templates, analytics, and bulk uploads.
          </p>
        </div>
        <Badge variant="purple" size="md" className="self-start sm:self-auto font-bold">
          ADMIN
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-soft">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {loading || !analytics ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-white"
                  onClick={async () => {
                    try {
                      const { exportsApi } = await import('../api/exports');
                      await exportsApi.downloadAdminTripsCsv();
                      showToast('success', 'Trips CSV downloaded.');
                    } catch {
                      showToast('error', 'Export failed.');
                    }
                  }}
                >
                  Export all trips
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-white"
                  onClick={async () => {
                    try {
                      const { exportsApi } = await import('../api/exports');
                      await exportsApi.downloadAdminUsersCsv();
                      showToast('success', 'Users CSV downloaded.');
                    } catch {
                      showToast('error', 'Export failed.');
                    }
                  }}
                >
                  Export all users
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Total Users" value={analytics.total_users} icon={<Users className="h-5 w-5" />} sub={`+${analytics.active_users} active`} />
                <KpiCard label="Trips" value={analytics.total_trips} icon={<Compass className="h-5 w-5" />} />
                <KpiCard label="Destinations" value={analytics.total_destinations} icon={<MapPin className="h-5 w-5" />} />
                <KpiCard label="Planned Spend" value={formatPrice(analytics.total_spend)} icon={<CurrencyIcon className="h-5 w-5" />} isText />
              </div>

              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
                <h3 className="text-base font-bold text-slate-900 mb-4">Trip creation trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trip_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="trips" stroke="#0d9488" fill="#0d948833" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RankingList title="Top cities" items={analytics.popular_cities.map((c) => ({ id: c.id, primary: c.name, secondary: c.country, metric: `${c.trips_count} trips` }))} />
                <RankingList title="Top activities" items={analytics.popular_activities.map((a) => ({ id: a.id, primary: a.name, secondary: a.city_name, metric: `${a.bookings_count} bookings` }))} />
              </div>

              <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.trip_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="trips" fill="#0d9488" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'users' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
          <AdminUsersSection />
        </div>
      )}

      {tab === 'cities' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
          <AdminCitiesSection />
        </div>
      )}

      {tab === 'activities' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
          <AdminActivitiesSection />
        </div>
      )}

      {tab === 'community' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
          <AdminCommunitySection />
        </div>
      )}

      {tab === 'templates' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft">
          <AdminTemplatesSection />
        </div>
      )}
    </div>
  );
};

function KpiCard({
  label,
  value,
  icon,
  sub,
  isText,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">
        {isText ? value : typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function RankingList({
  title,
  items,
}: {
  title: string;
  items: { id: number; primary: string; secondary: string; metric: string }[];
}) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft space-y-3">
      <h4 className="text-sm font-bold text-slate-900 uppercase">{title}</h4>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-700">#{idx + 1}</span>
            <div>
              <p className="text-xs font-bold text-slate-900">{item.primary}</p>
              <p className="text-[10px] text-slate-500">{item.secondary}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700">{item.metric}</span>
        </div>
      ))}
    </div>
  );
}
