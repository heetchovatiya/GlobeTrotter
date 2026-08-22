import React from 'react';
import { BudgetSummary, Expense } from '../../types';
import { Price } from '../common/Price';
import { Button } from '../common/Button';
import { ExpenseList } from '../expenses/ExpenseList';
import { IndianRupee, Plus, Receipt, TrendingUp } from 'lucide-react';

interface TripSpendingTrackerProps {
  budget: BudgetSummary;
  expenses: Expense[];
  loading?: boolean;
  onLogExpense: () => void;
  onDeleteExpense?: (expenseId: number) => void;
  onViewAll?: () => void;
  compact?: boolean;
}

export const TripSpendingTracker: React.FC<TripSpendingTrackerProps> = ({
  budget,
  expenses,
  loading = false,
  onLogExpense,
  onDeleteExpense,
  onViewAll,
  compact = false,
}) => {
  const generalSpent = budget.general_spent ?? budget.total_spent;
  const itineraryTotal = budget.itinerary_total ?? budget.total_budget;
  const grandTotal = budget.grand_total ?? itineraryTotal + generalSpent;
  const spentPct =
    grandTotal > 0 ? Math.min(100, Math.round((generalSpent / grandTotal) * 100)) : 0;

  return (
    <section className="rounded-3xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">General expenses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ad-hoc spending (meals, taxis, etc.) — separate from itinerary stay, transport &
              activities below.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={onLogExpense}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shrink-0 w-full sm:w-auto"
        >
          Log Expense
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
        <div className="bg-white p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Itinerary</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">
            <Price amount={itineraryTotal} zeroAsFree={false} />
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Stay + transport + activities</p>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">General</p>
          <p className="mt-1 text-lg font-extrabold text-brand-600">
            <Price amount={generalSpent} zeroAsFree={false} />
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Logged out-of-pocket</p>
        </div>
        <div className="bg-white p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total cost</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">
            <Price amount={grandTotal} zeroAsFree={false} />
          </p>
        </div>
        <div className="bg-white p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Breakdown</p>
          <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
            <p>
              Stay{' '}
              <Price amount={budget.itinerary_stay ?? 0} zeroAsFree={false} className="font-bold" />
            </p>
            <p>
              Transport{' '}
              <Price
                amount={budget.itinerary_transport ?? 0}
                zeroAsFree={false}
                className="font-bold"
              />
            </p>
            <p>
              Activities{' '}
              <Price
                amount={budget.itinerary_activities ?? 0}
                zeroAsFree={false}
                className="font-bold"
              />
            </p>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="p-5 sm:p-6 space-y-3">
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${spentPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {generalSpent === 0
              ? 'No general expenses logged yet'
              : `General spending is ${spentPct}% of total trip cost`}
          </p>

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4 text-brand-500" />
              General expense log
            </h3>
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Charts & analytics →
              </button>
            )}
          </div>

          <ExpenseList expenses={expenses} loading={loading} onDelete={onDeleteExpense} />
        </div>
      )}
    </section>
  );
};
