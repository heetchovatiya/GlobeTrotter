import React, { useEffect, useState } from 'react';
import { AdminAnalytics, AdminUser } from '../types';
import { adminApi } from '../api/admin';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  Users,
  MapPin,
  Compass,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { showToast } = useUIStore();

  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [stats, userList] = await Promise.all([
          adminApi.getAnalytics(),
          adminApi.getUsers(),
        ]);
        setAnalytics(stats);
        setUsers(userList);
      } catch (err) {
        console.error('Failed to load admin console data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: number) => {
    const current = users.find((u) => u.id === userId);
    if (!current) return;
    try {
      const updated = await adminApi.toggleUserStatus(userId, current.is_active);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(
        'success',
        `User ${updated.name} is now ${updated.is_active ? 'Active' : 'Suspended'}`
      );
    } catch {
      showToast('error', 'Failed to update user status.');
    }
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Header (Screen 12 wireframe) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-elevated">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-800">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" /> Screen 12 Admin Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Analytics & Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Role-gated dashboard monitoring user activity, destination popularity, and itinerary trends.
          </p>
        </div>

        <Badge variant="purple" size="md" className="self-start sm:self-auto font-bold">
          ADMIN PRIVILEGES VERIFIED
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Explorers</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {analytics.total_users.toLocaleString()}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              +{analytics.active_users} active this week
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Itineraries Created</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Compass className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {analytics.total_trips.toLocaleString()}
            </span>
            <p className="text-xs text-teal-600 font-semibold mt-1">
              +14% growth month over month
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Destinations</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {analytics.total_destinations}
            </span>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Across 22 countries worldwide
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Planned Spend</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${(analytics.total_spend / 1000000).toFixed(2)}M
            </span>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              Average $1,850 per itinerary
            </p>
          </div>
        </div>
      </div>

      {/* Chart: Growth Trends */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Platform Activity & Itinerary Creation Trends
            </h3>
            <p className="text-xs text-slate-500">
              Monthly distribution of created trip itineraries and newly registered travelers.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-brand-600">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Trips Created
            </span>
            <span className="flex items-center gap-1 text-purple-600">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Active Users
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.trip_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="trips"
                name="Trips"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTrips)"
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Users"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytics Ranking Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Cities */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Top Destination Cities
            </h4>
            <span className="text-xs text-slate-400 font-medium">Ranked by Trips</span>
          </div>

          <div className="space-y-3">
            {analytics.popular_cities.map((city, idx) => (
              <div
                key={city.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                    #{idx + 1}
                  </div>
                  <img
                    src={city.image_url}
                    alt={city.name}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{city.name}</h5>
                    <p className="text-[11px] text-slate-500">{city.country}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{city.trips_count} trips</span>
                  <p className="text-[10px] text-amber-600 font-bold">★ {city.popularity_score}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Activities */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Top Booked Activities
            </h4>
            <span className="text-xs text-slate-400 font-medium">Ranked by Inclusions</span>
          </div>

          <div className="space-y-3">
            {analytics.popular_activities.map((act, idx) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{act.name}</h5>
                    <p className="text-[11px] text-slate-500">{act.city_name} • {act.type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600">{act.bookings_count} bookings</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Registered Travelers</h3>
            <p className="text-xs text-slate-500">Manage user status, roles, and itinerary counts</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{users.length} Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-xl">User</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Trips</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5 flex items-center gap-3">
                    <img
                      src={user.profile_photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {user.city ? `${user.city}, ${user.country}` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={user.role === 'admin' ? 'purple' : 'default'} size="sm">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {user.trips_count}
                  </td>
                  <td className="px-4 py-3.5">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                        <XCircle className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant={user.is_active ? 'outline' : 'primary'}
                      onClick={() => handleToggleUserStatus(user.id)}
                      className="text-[11px] py-1"
                    >
                      {user.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

