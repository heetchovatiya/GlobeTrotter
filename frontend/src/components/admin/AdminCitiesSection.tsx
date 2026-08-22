import React, { useCallback, useEffect, useState } from 'react';
import { City } from '../../types';
import { adminApi } from '../../api/admin';
import { AdminSearchBar } from './AdminSearchBar';
import { BulkUploadPanel } from './BulkUploadPanel';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useUIStore } from '../../store/uiStore';
import { BULK_CITIES_TEMPLATE } from '../../utils/adminBulkTemplates';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const emptyCity = {
  name: '',
  country: '',
  cost_index: '50',
  popularity_score: '50',
  image_url: '',
};

export const AdminCitiesSection: React.FC = () => {
  const { showToast } = useUIStore();
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<City | null>(null);
  const [form, setForm] = useState(emptyCity);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getCities(q);
      setCities(res.items);
    } catch {
      showToast('error', 'Failed to load cities.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCity);
    setModalOpen(true);
  };

  const openEdit = (city: City) => {
    setEditing(city);
    setForm({
      name: city.name,
      country: city.country,
      cost_index: String(city.cost_index),
      popularity_score: String(city.popularity_score),
      image_url: city.image_url || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      country: form.country.trim(),
      cost_index: parseFloat(form.cost_index) || 0,
      popularity_score: parseInt(form.popularity_score, 10) || 0,
      image_url: form.image_url.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.updateCity(editing.id, payload);
        setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast('success', 'City updated.');
      } else {
        const created = await adminApi.createCity(payload);
        setCities((prev) => [created, ...prev]);
        showToast('success', 'City created.');
      }
      setModalOpen(false);
    } catch {
      showToast('error', 'Could not save city.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (city: City) => {
    if (!window.confirm(`Delete "${city.name}" and all its activities?`)) return;
    try {
      await adminApi.deleteCity(city.id);
      setCities((prev) => prev.filter((c) => c.id !== city.id));
      showToast('success', 'City deleted.');
    } catch {
      showToast('error', 'Could not delete city.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search cities…" />
        <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add city
        </Button>
      </div>

      <BulkUploadPanel
        title="Bulk upload cities (+ nested activities)"
        template={BULK_CITIES_TEMPLATE}
        onUpload={adminApi.bulkUploadCities}
        onSuccess={() => load(search || undefined)}
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Cost index</th>
              <th className="px-4 py-3">Popularity</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No cities found.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr key={city.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{city.name}</p>
                    <p className="text-[11px] text-slate-400">{city.country}</p>
                  </td>
                  <td className="px-4 py-3">{city.cost_index}</td>
                  <td className="px-4 py-3">{city.popularity_score}/100</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(city)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(city)}>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit city' : 'Add city'} maxWidth="md">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cost index" type="number" value={form.cost_index} onChange={(e) => setForm({ ...form, cost_index: e.target.value })} />
            <Input label="Popularity (0–100)" type="number" min="0" max="100" value={form.popularity_score} onChange={(e) => setForm({ ...form, popularity_score: e.target.value })} />
          </div>
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
