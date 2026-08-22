import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { tripsApi } from '../api/trips';
import { Trip } from '../types';
import { TripCard } from '../components/trips/TripCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Calendar,
  Globe,
  Compass,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { showToast } = useUIStore();

  const [preplannedTrips, setPreplannedTrips] = useState<Trip[]>([]);
  const [previousTrips, setPreviousTrips] = useState<Trip[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    city: user?.city || '',
    country: user?.country || '',
    additional_info: user?.additional_info || '',
  });

  useEffect(() => {
    const loadUserTrips = async () => {
      try {
        const allTrips = await tripsApi.getTrips();
        setPreplannedTrips(allTrips.filter((t) => t.status === 'planning' || t.status === 'upcoming'));
        setPreviousTrips(allTrips.filter((t) => t.status === 'completed'));
      } catch (err) {
        console.error('Failed to load user profile trips:', err);
      }
    };
    loadUserTrips();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(editFormData);
      showToast('success', 'Profile details updated successfully!');
      setIsEditModalOpen(false);
    } catch {
      showToast('error', 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Profile Header & Info Card (Screen 7 wireframe) */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative">
              <img
                src={
                  user?.profile_photo_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'User'}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover ring-4 ring-brand-100 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-brand-600 text-white shadow-xs">
                <Compass className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{user?.name}</h1>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  {user?.role}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 font-medium">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {user.email}
                  </span>
                )}
                {user?.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {user.city}, {user.country}
                  </span>
                )}
                {user?.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {user.phone_number}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed pt-1">
                {user?.additional_info ||
                  'GlobeTrotter explorer passionate about culture, alpine hikes, and photography.'}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="flex sm:flex-col justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone_number: user?.phone_number || '',
                  city: user?.city || '',
                  country: user?.country || '',
                  additional_info: user?.additional_info || '',
                });
                setIsEditModalOpen(true);
              }}
              leftIcon={<Edit2 className="h-4 w-4" />}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Preplanned Trips Section (Screen 7 wireframe) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Preplanned & Upcoming Trips
            </h2>
            <p className="text-xs text-slate-500">
              Trips currently in planning or scheduled for the future
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {preplannedTrips.length} Itineraries
          </span>
        </div>

        {preplannedTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {preplannedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} compact />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No upcoming trips planned yet.
          </div>
        )}
      </section>

      {/* Previous Trips Section (Screen 7 wireframe) */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Previous Trips & Memories
            </h2>
            <p className="text-xs text-slate-500">
              Completed travel itineraries and historical expenses
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {previousTrips.length} Completed
          </span>
        </div>

        {previousTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previousTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} compact />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No completed trips on record.
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Explorer Profile"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editFormData.phone_number}
              onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              value={editFormData.city}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
            <Input
              label="Country"
              value={editFormData.country}
              onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Bio / Travel Preferences
            </label>
            <textarea
              rows={3}
              value={editFormData.additional_info}
              onChange={(e) => setEditFormData({ ...editFormData, additional_info: e.target.value })}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

