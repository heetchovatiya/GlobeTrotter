import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminUser, UserRole } from '../../types';
import { adminApi } from '../../api/admin';
import { AdminSearchBar } from './AdminSearchBar';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle, Pencil, Plus, Trash2, XCircle } from 'lucide-react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole,
  city: '',
  country: '',
};

export const AdminUsersSection: React.FC = () => {
  const { showToast } = useUIStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      setUsers(await adminApi.getUsers(q));
    } catch {
      showToast('error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const filtered = useMemo(() => users, [users]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      city: user.city || '',
      country: user.country || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.updateUser(editing.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          city: form.city || undefined,
          country: form.country || undefined,
        });
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast('success', 'User updated.');
      } else {
        if (!form.password || form.password.length < 8) {
          showToast('error', 'Password must be at least 8 characters.');
          setSaving(false);
          return;
        }
        const created = await adminApi.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          city: form.city || undefined,
          country: form.country || undefined,
        });
        setUsers((prev) => [created, ...prev]);
        showToast('success', 'User created.');
      }
      setModalOpen(false);
    } catch {
      showToast('error', 'Could not save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user: AdminUser) => {
    try {
      const updated = await adminApi.toggleUserStatus(user.id, user.is_active);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast('success', `User ${updated.is_active ? 'activated' : 'suspended'}.`);
    } catch {
      showToast('error', 'Failed to update status.');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast('success', 'User deleted.');
    } catch {
      showToast('error', 'Could not delete user.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminSearchBar value={search} onChange={setSearch} placeholder="Search users by name or email…" />
        <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add user
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Trips</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'admin' ? 'purple' : 'default'} size="sm">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-bold">{user.trips_count}</td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-semibold">
                        <XCircle className="h-3.5 w-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(user)}>
                        {user.is_active ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(user)}>
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
        title={editing ? 'Edit user' : 'Add user'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {!editing && (
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
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
