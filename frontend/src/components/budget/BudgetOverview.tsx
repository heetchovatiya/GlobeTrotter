import React from 'react';
import { BudgetSummary } from '../../types';
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
import { DollarSign, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface BudgetOverviewProps {
  budget: BudgetSummary;
}

const CATEGORY_COLORS: Record<string, string> = {
  stay: '#0d9488',       // Teal
  transport: '#3b82f6',  // Blue
  activities: '#f59e0b', // Amber
  meals: '#ec4899',      // Pink
  other: '#8b5cf6',      // Purple
};

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budget }) => {
  const pieData = budget.by_category.map((item) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    color: CATEGORY_COLORS[item.category] || '#94a3b8',
  }));

  const hasOverbudgetDays = budget.overbudget_days && budget.overbudget_days.length > 0;

  return (
    <div className="space-y-6">
      {/* Alert Banner if over budget */}
      {hasOverbudgetDays && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Budget Alert:</span> Spending exceeded estimated daily budget on{' '}
            <span className="font-semibold text-amber-800">
              {budget.overbudget_days.join(', ')}
            </span>
            . Consider adjusting remaining activities or meals.
          </div>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Total Allocated Budget
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${budget.total_budget.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Planned across all stops & sections</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Estimated Spent
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-600">
              ${budget.total_spent.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-brand-700">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{((budget.total_spent / (budget.total_budget || 1)) * 100).toFixed(0)}% of total</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            Remaining Balance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                budget.remaining_budget >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ${budget.remaining_budget.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Within safety buffer</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Expense by Category
            </h4>
            <span className="text-xs font-medium text-slate-500">Distribution</span>
          </div>

          <div className="h-64 w-full">
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend chips */}
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name} (${item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Estimated vs Actual Bar Chart */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Daily Budget vs Actual
            </h4>
            <span className="text-xs font-medium text-slate-500">Day by Day</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budget.by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [`$${val}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="budget" name="Estimated Budget" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" name="Actual Cost" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

