import React from 'react';
import { BudgetSummary, ExpenseCategory } from '../../types';
import { useFormatPrice, Price } from '../common/Price';
import { useCurrencyStore } from '../../store/currencyStore';
import { convertAmount, convertToUsd, formatAxisAmount, formatDisplayAmount } from '../../utils/currency';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AlertTriangle, CalendarDays } from 'lucide-react';

interface BudgetOverviewProps {
  budget: BudgetSummary;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transport: '#3b82f6',
  stay: '#0d9488',
  activities: '#f59e0b',
  meals: '#ec4899',
  other: '#8b5cf6',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: 'Transport',
  stay: 'Stay & Lodging',
  activities: 'Activities',
  meals: 'Meals',
  other: 'Other',
};

const ALL_CATEGORIES: ExpenseCategory[] = [
  'transport',
  'stay',
  'activities',
  'meals',
  'other',
];

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budget }) => {
  const formatPrice = useFormatPrice();
  const currency = useCurrencyStore((s) => s.currency);
  const toDisplay = (amountUsd: number) => convertAmount(amountUsd, currency);
  const formatChartValue = (displayValue: number) => formatDisplayAmount(displayValue, currency);
  const dayCount = Math.max(budget.by_day.length, 1);
  const avgBudgetPerDay = budget.total_budget / dayCount;
  const avgSpentPerDay = budget.total_spent / dayCount;

  const categoryMap = new Map(budget.by_category.map((item) => [item.category, item.amount]));
  const fullCategoryBreakdown = ALL_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    amount: categoryMap.get(category) || 0,
    color: CATEGORY_COLORS[category],
    percentage:
      budget.total_spent > 0
        ? Math.round(((categoryMap.get(category) || 0) / budget.total_spent) * 100)
        : 0,
  }));

  const pieData = fullCategoryBreakdown
    .filter((item) => item.amount > 0)
    .map((item) => ({
      name: item.label,
      value: toDisplay(item.amount),
      color: item.color,
    }));

  const categoryBarData = fullCategoryBreakdown.map((item) => ({
    name: item.label,
    amount: toDisplay(item.amount),
    fill: item.color,
  }));

  const dailyChartData = budget.by_day.map((day) => ({
    ...day,
    budget: toDisplay(day.budget),
    actual: toDisplay(day.actual),
  }));

  const hasOverbudgetDays = budget.overbudget_days && budget.overbudget_days.length > 0;

  return (
    <div className="space-y-6">
      {hasOverbudgetDays && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Overbudget Alert:</span> Spending exceeded the estimated daily
            budget on{' '}
            <span className="font-semibold text-amber-800">
              {budget.overbudget_days
                .map((d) =>
                  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                )
                .join(', ')}
            </span>
            . Review those days and adjust remaining plans.
          </div>
        </div>
      )}

      {budget.by_day.filter((d) => d.is_overbudget).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budget.by_day
            .filter((d) => d.is_overbudget)
            .map((day) => (
              <div
                key={day.date}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"
              >
                <span className="font-bold">{day.day_label}</span> — spent{' '}
                <Price amount={day.actual} /> vs budget <Price amount={day.budget} />
              </div>
            ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Itinerary Plan
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatPrice(budget.itinerary_total ?? budget.total_budget)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Stay {formatPrice(budget.itinerary_stay ?? 0)} · Transport{' '}
            {formatPrice(budget.itinerary_transport ?? 0)} · Activities{' '}
            {formatPrice(budget.itinerary_activities ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            General Expenses
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-brand-600">
            {formatPrice(budget.general_spent ?? budget.total_spent)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Ad-hoc spending logged outside itinerary</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Grand Total
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatPrice(budget.grand_total ?? budget.total_budget + (budget.general_spent ?? 0))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Itinerary plan + general expenses</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Avg / Day
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {formatPrice(avgBudgetPerDay)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            General avg: {formatPrice(avgSpentPerDay)} over {dayCount} day{dayCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
          Logged Spending by Category
        </h4>
        <div className="space-y-3">
          {fullCategoryBreakdown.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-900">
                  <Price amount={item.amount} /> ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(item.percentage, item.amount > 0 ? 4 : 0)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Category Distribution
            </h4>
            <span className="text-xs font-medium text-slate-500">Pie chart</span>
          </div>

          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatChartValue(value), 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No expense data yet
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Category Totals
            </h4>
            <span className="text-xs font-medium text-slate-500">Bar chart</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    formatAxisAmount(convertToUsd(Number(value), currency), currency)
                  }
                />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [formatChartValue(val), 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {categoryBarData.map((entry, index) => (
                    <Cell key={`cat-bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Daily Budget vs Actual
          </h4>
          <span className="text-xs font-medium text-slate-500">Day-by-day bar chart</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day_label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => formatAxisAmount(convertToUsd(Number(value), currency), currency)}
              />
              <Tooltip
                formatter={(val: number) => [formatChartValue(val), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="budget" name="Planned" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="Logged spent" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
