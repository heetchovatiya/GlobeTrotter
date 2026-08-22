import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CommunityPost, Trip } from '../types';
import { communityApi } from '../api/community';
import { tripsApi } from '../api/trips';
import { CommunityPostCard } from '../components/community/CommunityPostCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Skeleton } from '../components/common/Skeleton';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import {
  Users,
  Plus,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Route,
  Calendar,
  Share2,
} from 'lucide-react';

type PostMode = 'story' | 'itinerary';

export const Community: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [loading, setLoading] = useState(true);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postMode, setPostMode] = useState<PostMode>('story');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCommunity = async () => {
      setLoading(true);
      try {
        const postsData = await communityApi.getPosts(sortBy);
        setPosts(postsData);
        if (isAuthenticated) {
          const tripsData = await tripsApi.getTrips();
          setUserTrips(tripsData);
        }
      } catch (err) {
        console.error('Failed to load community feed:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCommunity();
  }, [sortBy, isAuthenticated]);

  useEffect(() => {
    const shareTripId = searchParams.get('shareTrip');
    if (shareTripId) {
      setPostMode('itinerary');
      setSelectedTripId(shareTripId);
      setIsPostModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openModal = (mode: PostMode) => {
    if (!isAuthenticated) {
      showToast('info', 'Sign in to share with the community.');
      navigate('/login', { state: { from: { pathname: '/community' } } });
      return;
    }
    setPostMode(mode);
    setIsPostModalOpen(true);
  };

  const selectedTrip = userTrips.find((t) => String(t.id) === selectedTripId);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (postMode === 'itinerary' && !selectedTripId) {
      showToast('error', 'Select an itinerary to share.');
      return;
    }
    if (postMode === 'story' && !postContent.trim()) return;

    setIsSubmitting(true);
    try {
      let created: CommunityPost;
      if (postMode === 'itinerary') {
        created = await communityApi.shareItinerary({
          trip_id: Number(selectedTripId),
          content: postContent.trim() || undefined,
          image_url: postImageUrl || undefined,
        });
      } else {
        created = await communityApi.createPost({
          content: postContent,
          image_url: postImageUrl || undefined,
          trip_id: selectedTripId ? Number(selectedTripId) : undefined,
        });
      }
      setPosts([created, ...posts]);
      setPostContent('');
      setPostImageUrl('');
      setSelectedTripId('');
      setIsPostModalOpen(false);
      showToast(
        'success',
        postMode === 'itinerary'
          ? 'Itinerary shared to community with a public copy link!'
          : 'Your travel story has been published!'
      );
    } catch {
      showToast('error', 'Failed to share post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" /> Community Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Traveler Stories & Itineraries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Share tips or publish a full itinerary others can view and copy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => openModal('story')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Share Story
          </Button>
          <Button
            variant="primary"
            onClick={() => openModal('itinerary')}
            leftIcon={<Route className="h-4 w-4" />}
            className="shadow-md shadow-brand-500/20"
          >
            Share Itinerary
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-soft">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Feed Order</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'recent' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'popular' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trending
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-3xl" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <CommunityPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-white border border-dashed border-slate-200 p-8 space-y-3">
          <Sparkles className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No stories yet</h3>
          <p className="text-xs text-slate-500">Be the first to share an itinerary or travel advice!</p>
        </div>
      )}

      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title={postMode === 'itinerary' ? 'Share Itinerary to Community' : 'Share Travel Story'}
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          {postMode === 'itinerary' ? (
            <>
              <p className="text-xs text-slate-600 bg-brand-50 border border-brand-100 rounded-xl p-3">
                Your itinerary will be published with a public link others can view and copy to their account.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Itinerary *
                </label>
                {userTrips.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {userTrips.map((trip) => (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => setSelectedTripId(String(trip.id))}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          selectedTripId === String(trip.id)
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {trip.cover_photo_url && (
                          <img
                            src={trip.cover_photo_url}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">{trip.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {trip.start_date} – {trip.end_date}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                    No trips yet.{' '}
                    <button
                      type="button"
                      className="text-brand-600 font-bold underline"
                      onClick={() => navigate('/trips/new')}
                    >
                      Create one first
                    </button>
                  </p>
                )}
              </div>

              {selectedTrip && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Preview: </span>
                  {selectedTrip.name} · {selectedTrip.status}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Caption (optional)
                </label>
                <textarea
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Tell the community why this itinerary is worth copying..."
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  What did you discover?
                </label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Describe hidden gems, dining spots, or travel tips..."
                  className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attach Itinerary (optional)
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  <option value="">No itinerary attached</option>
                  {userTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.start_date})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Input
            label="Photo URL (Optional)"
            leftIcon={<ImageIcon className="h-4 w-4" />}
            value={postImageUrl}
            onChange={(e) => setPostImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsPostModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={postMode === 'itinerary' ? <Share2 className="h-4 w-4" /> : undefined}
              disabled={postMode === 'itinerary' && !selectedTripId}
            >
              {postMode === 'itinerary' ? 'Publish Itinerary' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
