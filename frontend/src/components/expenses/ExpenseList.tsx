import React from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { Price } from '../common/Price';
import { Button } from '../common/Button';
import { Trash2 } from 'lucide-react';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: 'Transport',
  stay: 'Stay',
  activities: 'Activities',
  meals: 'Meals',
  other: 'Other',
};

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (expenseId: number) => void;
  loading?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDelete,
  loading = false,
}) => {
  const manual = expenses.filter((e) => !e.section_id);

  if (loading) {
    return <p className="text-xs text-slate-400 py-4">Loading expenses…</p>;
  }

  if (manual.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4">
        No manual expenses yet. Section budgets appear automatically from your itinerary.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
          <tr>
            <th className="text-left px-4 py-2.5">Date</th>
            <th className="text-left px-4 py-2.5">Category</th>
            <th className="text-left px-4 py-2.5 hidden sm:table-cell">Note</th>
            <th className="text-right px-4 py-2.5">Amount</th>
            {onDelete && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {manual.map((exp) => (
            <tr key={exp.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 text-xs font-medium text-slate-700">
                {exp.expense_date || '—'}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                {CATEGORY_LABELS[exp.category]}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell line-clamp-1">
                {exp.note || '—'}
              </td>
              <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-right">
                <Price amount={exp.amount} />
              </td>
              {onDelete && (
                <td className="px-2 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(exp.id)}
                    aria-label="Delete expense"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
