import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ActivityType, City } from '../../types';
import { adminApi } from '../../api/admin';
import { AdminSearchBar } from './AdminSearchBar';
import { BulkUploadPanel } from './BulkUploadPanel';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useUIStore } from '../../store/uiStore';
import { ACTIVITY_TYPES, BULK_ACTIVITIES_TEMPLATE } from '../../utils/adminBulkTemplates';
import { Price } from '../common/Price';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const emptyActivity = {
  city_id: '',
  name: '',
  type: 'sightseeing' as ActivityType,
  cost: '0',
  duration_mins: '60',
  description: '',
  image_url: '',
};

export const AdminActivitiesSection: React.FC = () => {
  const { showToast } = useUIStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState(emptyActivity);
  const [saving, setSaving] = useState(false);

  const cityName = (id: number) => cities.find((c) => c.id === id)?.name || `City #${id}`;

  const loadCities = useCallback(async () => {
    try {
      const res = await adminApi.getCities();
      setCities(res.items);
    } catch {
      /* cities optional for display */
    }
  }, []);

  const load = useCallback(async (q?: string, cityId?: number) => {
    setLoading(true);
    try {
      const res = await adminApi.getActivities(q, cityId);
      setActivities(res.items);
    } catch {
      showToast('error', 'Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  useEffect(() => {
    const t = setTimeout(
      () => load(search || undefined, cityFilter ? Number(cityFilter) : undefined),
      300
    );
    return () => clearTimeout(t);
  }, [search, cityFilter, load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyActivity,
      city_id: cities[0] ? String(cities[0].id) : '',
    });
    setModalOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      city_id: String(activity.city_id),
      name: activity.name,
      type: activity.type,
      cost: String(activity.cost),
      duration_mins: String(activity.duration_mins),
      description: activity.description || '',
      image_url: activity.image_url || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cityId = parseInt(form.city_id, 10);
    if (!cityId) {
      showToast('error', 'Select a city.');
      return;
    }
    const payload = {
      city_id: cityId,
      name: form.name.trim(),
      type: form.type,
      cost: parseFloat(form.cost) || 0,
      duration_mins: parseInt(form.duration_mins, 10) || 60,
      description: form.description.trim() || undefined,
      image_url: form.image_url.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.updateActivity(editing.id, payload);
        setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        showToast('success', 'Activity updated.');
      } else {
        const created = await adminApi.createActivity(payload);
        setActivities((prev) => [created, ...prev]);
        showToast('success', 'Activity created.');
      }
      setModalOpen(false);
    } catch {
      showToast('error', 'Could not save activity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!window.confirm(`Delete "${activity.name}"?`)) return;
    try {
      await adminApi.deleteActivity(activity.id);
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
      showToast('success', 'Activity deleted.');
    } catch {
      showToast('error', 'Could not delete activity.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search activities…" />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm max-w-xs"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.country}
            </option>
          ))}
        </select>
        <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add activity
        </Button>
      </div>

      <BulkUploadPanel
        title="Bulk upload activities"
        template={BULK_ACTIVITIES_TEMPLATE}
        onUpload={adminApi.bulkUploadActivities}
        onSuccess={() =>
          load(search || undefined, cityFilter ? Number(cityFilter) : undefined)
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No activities found.
                </td>
              </tr>
            ) : (
              activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{act.name}</td>
                  <td className="px-4 py-3">{cityName(act.city_id)}</td>
                  <td className="px-4 py-3 capitalize">{act.type}</td>
                  <td className="px-4 py-3">
                    <Price amount={act.cost} zeroAsFree={false} />
                  </td>
                  <td className="px-4 py-3">{act.duration_mins} min</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(act)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(act)}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit activity' : 'Add activity'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">City</label>
            <select
              required
              value={form.city_id}
              onChange={(e) => setForm({ ...form, city_id: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cost (USD)" type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <Input label="Duration (mins)" type="number" min="1" value={form.duration_mins} onChange={(e) => setForm({ ...form, duration_mins: e.target.value })} />
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
