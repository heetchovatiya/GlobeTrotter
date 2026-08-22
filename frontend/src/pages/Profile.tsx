import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { citiesApi } from '../api/cities';
import { uploadsApi } from '../api/uploads';
import { Trip, City } from '../types';
import { TripCard } from '../components/trips/TripCard';
import { CityCard } from '../components/search/CityCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Globe,
  Compass,
  Trash2,
  Upload,
  Bookmark,
  Shield,
} from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, deleteAccount, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [preplannedTrips, setPreplannedTrips] = useState<Trip[]>([]);
  const [previousTrips, setPreviousTrips] = useState<Trip[]>([]);
  const [savedDestinations, setSavedDestinations] = useState<City[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || '',
    city: user?.city || '',
    country: user?.country || '',
    language_pref: user?.language_pref || 'en',
    profile_photo_url: user?.profile_photo_url || '',
    additional_info: user?.additional_info || '',
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const allTrips = await tripsApi.getTrips();
        setPreplannedTrips(allTrips.filter((t) => t.status === 'planning' || t.status === 'upcoming'));
        setPreviousTrips(allTrips.filter((t) => t.status === 'completed'));

        const cityIds = new Set<number>();
        for (const trip of allTrips) {
          try {
            const stops = await stopsApi.getStops(trip.id);
            stops.forEach((stop) => cityIds.add(stop.city_id));
          } catch {
            // ignore per-trip stop load failures
          }
        }

        if (cityIds.size > 0) {
          const allCities = await citiesApi.getCities({ limit: 100 });
          setSavedDestinations(allCities.filter((city) => cityIds.has(city.id)));
        }
      } catch (err) {
        console.error('Failed to load user profile data:', err);
      }
    };
    loadProfileData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const url = await uploadsApi.uploadProfilePhoto(file);
      await updateProfile({ profile_photo_url: url });
      setEditFormData((prev) => ({ ...prev, profile_photo_url: url }));
      showToast('success', 'Profile photo updated.');
    } catch {
      showToast('error', 'Failed to upload profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: editFormData.name,
        phone_number: editFormData.phone_number || undefined,
        city: editFormData.city || undefined,
        country: editFormData.country || undefined,
        language_pref: editFormData.language_pref,
        profile_photo_url: editFormData.profile_photo_url || undefined,
      });
      showToast('success', 'Profile settings saved.');
      setIsEditModalOpen(false);
    } catch {
      showToast('error', 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      showToast('success', 'Your account has been deleted.');
      navigate('/');
    } catch {
      showToast('error', 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-brand-600 text-white shadow-xs hover:bg-brand-700"
                aria-label="Upload profile photo"
              >
                <Upload className="h-4 w-4" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
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
                {user?.language_pref && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {LANGUAGE_OPTIONS.find((l) => l.value === user.language_pref)?.label ||
                      user.language_pref}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditFormData({
                  name: user?.name || '',
                  phone_number: user?.phone_number || '',
                  city: user?.city || '',
                  country: user?.country || '',
                  language_pref: user?.language_pref || 'en',
                  profile_photo_url: user?.profile_photo_url || '',
                  additional_info: user?.additional_info || '',
                });
                setIsEditModalOpen(true);
              }}
              leftIcon={<Edit2 className="h-4 w-4" />}
            >
              Edit Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">Account & Privacy</h2>
        </div>
        <p className="text-sm text-slate-600">
          Manage your profile preferences. Email cannot be changed here for security reasons.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4 text-rose-600" />}
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Delete Account
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-brand-600" />
              Saved Destinations
            </h2>
            <p className="text-xs text-slate-500">Cities from your trip stops and itineraries</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-brand-600 hover:text-brand-700">
            Explore more
          </Link>
        </div>

        {savedDestinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedDestinations.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No saved destinations yet. Create a trip to start building your list.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">Upcoming Trips</h2>
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

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">Previous Trips</h2>
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

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Profile & Settings"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />

          <Input
            label="Email Address"
            type="email"
            value={user?.email || ''}
            disabled
            hint="Email cannot be changed"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              value={editFormData.phone_number}
              onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Language Preference
              </label>
              <select
                value={editFormData.language_pref}
                onChange={(e) => setEditFormData({ ...editFormData, language_pref: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={editFormData.city} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} />
            <Input label="Country" value={editFormData.country} onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })} />
          </div>

          <Input
            label="Profile Photo URL"
            value={editFormData.profile_photo_url}
            onChange={(e) => setEditFormData({ ...editFormData, profile_photo_url: e.target.value })}
            placeholder="Or upload using the camera button on your avatar"
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Settings
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete account?" maxWidth="sm">
        <p className="text-sm text-slate-600">
          This permanently deletes your account, trips, and all associated data. This action cannot
          be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Delete My Account
          </Button>
        </div>
      </Modal>
    </div>
  );
};
