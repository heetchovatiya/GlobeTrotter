import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ledgerApi, LedgerFilters } from '../api/ledger';
import { TravelLedger as TravelLedgerData, TripStatus } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Price } from '../components/common/Price';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import { BookOpen, Download, Filter, ArrowLeft } from 'lucide-react';

const STATUS_TABS: { label: string; value: TripStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Planning', value: 'planning' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
];

export const TravelLedger: React.FC = () => {
  const { showToast } = useUIStore();
  const [ledger, setLedger] = useState<TravelLedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LedgerFilters>({ status: 'all' });

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ledgerApi.getLedger(filters);
      setLedger(data);
    } catch {
      showToast('error', 'Could not load travel ledger.');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const handleExport = async () => {
    try {
      await ledgerApi.downloadLedgerCsv(filters);
      showToast('success', 'Ledger exported.');
    } catch {
      showToast('error', 'Export failed.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-brand-600" />
            Travel Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personal register of planned vs actual spend across all your trips.
          </p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: tab.value }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filters.status === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">From</label>
            <input
              type="date"
              value={filters.start_from || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, start_from: e.target.value || undefined }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">To</label>
            <input
              type="date"
              value={filters.start_to || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, start_to: e.target.value || undefined }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {loading || !ledger ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft">
              <p className="text-[10px] font-bold uppercase text-slate-400">Trips</p>
              <p className="text-2xl font-extrabold text-slate-900">{ledger.totals.trip_count}</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft">
              <p className="text-[10px] font-bold uppercase text-slate-400">Planned</p>
              <p className="text-xl font-extrabold text-brand-700">
                <Price amount={ledger.totals.total_planned} />
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft">
              <p className="text-[10px] font-bold uppercase text-slate-400">Spent</p>
              <p className="text-xl font-extrabold text-emerald-700">
                <Price amount={ledger.totals.total_spent} />
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-soft">
              <p className="text-[10px] font-bold uppercase text-slate-400">Variance</p>
              <p
                className={`text-xl font-extrabold ${
                  ledger.totals.total_variance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                <Price amount={Math.abs(ledger.totals.total_variance)} />
                {ledger.totals.total_variance > 0 ? ' over' : ledger.totals.total_variance < 0 ? ' under' : ''}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Trip</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Dates</th>
                  <th className="text-right px-4 py-3">Planned</th>
                  <th className="text-right px-4 py-3">Spent</th>
                  <th className="text-right px-4 py-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                      No trips match your filters.
                    </td>
                  </tr>
                ) : (
                  ledger.rows.map((row) => (
                    <tr key={row.trip_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link
                          to={`/trips/${row.trip_id}`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {row.trip_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {row.start_date} – {row.end_date}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <Price amount={row.planned_budget} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <Price amount={row.total_spent} />
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          row.variance > 0 ? 'text-rose-600' : row.variance < 0 ? 'text-emerald-600' : 'text-slate-600'
                        }`}
                      >
                        {row.variance > 0 ? '+' : ''}
                        <Price amount={row.variance} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {ledger.rows.length > 0 && (
                <tfoot className="bg-slate-900 text-white text-xs font-bold">
                  <tr>
                    <td className="px-4 py-3" colSpan={3}>
                      TOTALS ({ledger.totals.trip_count} trips)
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Price amount={ledger.totals.total_planned} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Price amount={ledger.totals.total_spent} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Price amount={ledger.totals.total_variance} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
};
