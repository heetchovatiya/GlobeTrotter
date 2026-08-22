import React, { useEffect, useState } from 'react';
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
import { Users, Plus, Sparkles, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export const Community: React.FC = () => {
  const { showToast } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userTrips, setUserTrips] = useState<Trip[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [loading, setLoading] = useState(true);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await communityApi.createPost({
        content: postContent,
        image_url: postImageUrl || undefined,
        trip_id: selectedTripId ? Number(selectedTripId) : undefined,
      });
      setPosts([created, ...posts]);
      setPostContent('');
      setPostImageUrl('');
      setSelectedTripId('');
      setIsPostModalOpen(false);
      showToast('success', 'Your travel story has been published to the community!');
    } catch {
      showToast('error', 'Failed to share post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header Banner (Screen 10 wireframe) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" /> Screen 10 Community Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Traveler Stories & Discoveries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Share tips, itineraries, and real travel moments from your journeys.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsPostModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shadow-md shadow-brand-500/20"
        >
          Share Story
        </Button>
      </div>

      {/* Sort Filter Tabs */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-soft">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Feed Order
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'recent'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sortBy === 'popular'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Trending / Most Liked
          </button>
        </div>
      </div>

      {/* Feed Posts */}
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

      {/* Share Post Modal */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Share Travel Story with Community"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              What did you discover?
            </label>
            <textarea
              rows={4}
              required
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Describe hidden gems, best dining spots, hiking trails, or travel tips..."
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <Input
            label="Photo URL (Optional)"
            leftIcon={<ImageIcon className="h-4 w-4" />}
            value={postImageUrl}
            onChange={(e) => setPostImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach One of Your Itineraries (Optional)
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              >
                <option value="">Do not attach an itinerary</option>
                {userTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.start_date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsPostModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

