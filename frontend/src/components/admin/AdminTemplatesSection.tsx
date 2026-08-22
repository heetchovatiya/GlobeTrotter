import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminTripTemplate, AdminTemplateSection } from '../../api/admin';
import { AdminSearchBar } from './AdminSearchBar';
import { BulkUploadPanel } from './BulkUploadPanel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useUIStore } from '../../store/uiStore';
import { MANUAL_TEMPLATE_SAMPLE } from '../../utils/adminBulkTemplates';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const emptyForm = {
  id: '',
  name: '',
  description: '',
  durationDays: '7',
  cityNames: '',
  sectionsJson: JSON.stringify(MANUAL_TEMPLATE_SAMPLE.sections, null, 2),
  isActive: true,
};

export const AdminTemplatesSection: React.FC = () => {
  const { showToast } = useUIStore();
  const [templates, setTemplates] = useState<AdminTripTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTripTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(await adminApi.getTemplates(search || undefined, true));
    } catch {
      showToast('error', 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (template: AdminTripTemplate) => {
    setEditing(template);
    setForm({
      id: template.id,
      name: template.name,
      description: template.description,
      durationDays: String(template.durationDays),
      cityNames: template.cityNames.join(', '),
      sectionsJson: JSON.stringify(template.sections, null, 2),
      isActive: template.isActive,
    });
    setModalOpen(true);
  };

  const parseSections = (): AdminTemplateSection[] | null => {
    try {
      const parsed = JSON.parse(form.sectionsJson);
      if (!Array.isArray(parsed)) throw new Error('Sections must be an array');
      return parsed;
    } catch {
      showToast('error', 'Invalid sections JSON.');
      return null;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const sections = parseSections();
    if (!sections) return;
    const cityNames = form.cityNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (cityNames.length === 0) {
      showToast('error', 'Add at least one city name.');
      return;
    }
    const durationDays = parseInt(form.durationDays, 10);
    if (!Number.isFinite(durationDays) || durationDays < 1) {
      showToast('error', 'Duration must be at least 1 day.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.updateTemplate(editing.id, {
          name: form.name,
          description: form.description,
          durationDays,
          cityNames,
          sections,
          isActive: form.isActive,
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showToast('success', 'Template updated.');
      } else {
        const created = await adminApi.createTemplate({
          id: form.id.trim() || undefined,
          name: form.name,
          description: form.description,
          durationDays,
          cityNames,
          sections,
        });
        setTemplates((prev) => [created, ...prev]);
        showToast('success', 'Template created.');
      }
      setModalOpen(false);
    } catch {
      showToast('error', editing ? 'Failed to update template.' : 'Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: AdminTripTemplate) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    try {
      await adminApi.deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      showToast('success', 'Template deleted.');
    } catch {
      showToast('error', 'Failed to delete template.');
    }
  };

  const handleBulkCreate = async (data: unknown) => {
    const payload = data as {
      templates?: Array<{
        id?: string;
        name: string;
        description?: string;
        duration_days: number;
        city_names: string[];
        sections?: AdminTemplateSection[];
      }>;
    };
    const items = payload.templates ?? [];
    let created = 0;
    const errors: string[] = [];
    for (const item of items) {
      try {
        await adminApi.createTemplate({
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          durationDays: item.duration_days,
          cityNames: item.city_names,
          sections: item.sections ?? [],
        });
        created += 1;
      } catch {
        errors.push(item.name);
      }
    }
    await load();
    return { created, updated: 0, skipped: 0, errors };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tour templates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add templates manually or promote shared community itineraries. City names must exist in the catalog.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New template
        </Button>
      </div>

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search templates…" />

      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading templates…</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No custom templates yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Cities</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((template) => (
                <tr key={template.id} className="bg-white hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{template.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{template.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{template.cityNames.join(' → ')}</td>
                  <td className="px-4 py-3">{template.durationDays}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {template.sourcePostId
                      ? `Post #${template.sourcePostId}`
                      : template.sourceTripId
                        ? `Trip #${template.sourceTripId}`
                        : 'Manual'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={template.isActive ? 'success' : 'warning'} size="sm">
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(template)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(template)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkUploadPanel
        title="Tour Templates"
        template={MANUAL_TEMPLATE_SAMPLE}
        onUpload={handleBulkCreate}
        onSuccess={load}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit template' : 'Create template'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editing && (
            <Input
              label="Template ID (optional slug)"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              placeholder="e.g. rajasthan-heritage"
            />
          )}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (days)"
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              required
            />
            <Input
              label="City names (comma-separated)"
              value={form.cityNames}
              onChange={(e) => setForm((f) => ({ ...f, cityNames: e.target.value }))}
              placeholder="Delhi, Agra, Jaipur"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Sections (JSON)</label>
            <textarea
              className="w-full min-h-[160px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono"
              value={form.sectionsJson}
              onChange={(e) => setForm((f) => ({ ...f, sectionsJson: e.target.value }))}
            />
          </div>
          {editing && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (visible to travelers)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
