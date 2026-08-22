import React, { useState } from 'react';
import { ExpenseCategory } from '../../types';
import { ExpenseCreatePayload, expensesApi } from '../../api/expenses';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { IndianRupee, Calendar } from 'lucide-react';

interface AddExpenseModalProps {
  tripId: number | string;
  tripStartDate: string;
  tripEndDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'stay', label: 'Stay & Lodging' },
  { value: 'activities', label: 'Activities' },
  { value: 'meals', label: 'Meals' },
  { value: 'other', label: 'Other' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  tripId,
  tripStartDate,
  tripEndDate,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useUIStore();
  const [category, setCategory] = useState<ExpenseCategory>('meals');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(tripStartDate);
  const [note, setNote] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      showToast('error', 'Enter a valid amount.');
      return;
    }
    if (!expenseDate) {
      showToast('error', 'Select an expense date.');
      return;
    }

    setSaving(true);
    try {
      const payload: ExpenseCreatePayload = {
        category,
        amount: parsed,
        expense_date: expenseDate,
        note: note.trim() || undefined,
        receipt_url: receiptUrl.trim() || undefined,
      };
      await expensesApi.createExpense(tripId, payload);
      showToast('success', 'Expense logged.');
      onSaved();
      onClose();
      setAmount('');
      setNote('');
      setReceiptUrl('');
    } catch {
      showToast('error', 'Could not save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log manual expense" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">
          Manual expenses are added on top of section budgets. Use this for meals, taxis, or
          receipts not tied to an itinerary section.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (USD base)"
            type="number"
            min="0.01"
            step="0.01"
            required
            leftIcon={<IndianRupee className="h-4 w-4" />}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <Input
          label="Expense date"
          type="date"
          required
          min={tripStartDate}
          max={tripEndDate}
          leftIcon={<Calendar className="h-4 w-4" />}
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Note <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Dinner at local restaurant"
            className="block w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Input
          label="Receipt URL"
          value={receiptUrl}
          onChange={(e) => setReceiptUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Save expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
