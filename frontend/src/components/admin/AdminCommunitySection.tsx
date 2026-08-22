import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, AdminCommunityPost } from '../../api/admin';
import { AdminSearchBar } from './AdminSearchBar';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useUIStore } from '../../store/uiStore';
import { Eye, EyeOff, Map, Sparkles, Trash2 } from 'lucide-react';

export const AdminCommunitySection: React.FC = () => {
  const { showToast } = useUIStore();
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [search, setSearch] = useState('');
  const [showHidden, setShowHidden] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await adminApi.getCommunityPosts(search || undefined, showHidden));
    } catch {
      showToast('error', 'Failed to load community posts.');
    } finally {
      setLoading(false);
    }
  }, [search, showHidden, showToast]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleHide = async (post: AdminCommunityPost) => {
    setBusyId(post.id);
    try {
      const updated = await adminApi.moderateCommunityPost(post.id, !post.isHidden);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast('success', updated.isHidden ? 'Post hidden from community.' : 'Post visible again.');
    } catch {
      showToast('error', 'Failed to update post visibility.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (post: AdminCommunityPost) => {
    if (!window.confirm('Delete this post permanently? Comments will also be removed.')) return;
    setBusyId(post.id);
    try {
      await adminApi.deleteCommunityPost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      showToast('success', 'Post deleted.');
    } catch {
      showToast('error', 'Failed to delete post.');
    } finally {
      setBusyId(null);
    }
  };

  const handlePromote = async (post: AdminCommunityPost) => {
    if (!post.tripId) return;
    const name = window.prompt('Template name (optional)', post.trip?.name || '');
    if (name === null) return;
    setBusyId(post.id);
    try {
      await adminApi.createTemplateFromPost(post.id, name.trim() || undefined);
      showToast('success', 'Tour promoted to template.');
    } catch {
      showToast('error', 'Could not create template from this post.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Community posts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hide or delete posts. Content cannot be edited. Promote shared itineraries to tour templates.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show hidden posts
        </label>
      </div>

      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search post content…" />

      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No community posts found.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`rounded-2xl border p-4 space-y-3 ${
                post.isHidden ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{post.authorName}</span>
                    <span className="text-[10px] text-slate-500">{post.authorEmail}</span>
                    {post.isHidden && (
                      <Badge variant="warning" size="sm">
                        Hidden
                      </Badge>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {post.trip && (
                    <p className="text-xs text-brand-700 font-semibold flex items-center gap-1">
                      <Map className="h-3 w-3" />
                      Linked trip: {post.trip.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.tripId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === post.id}
                      onClick={() => handlePromote(post)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      To template
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyId === post.id}
                    onClick={() => handleHide(post)}
                  >
                    {post.isHidden ? (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Unhide
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 mr-1" />
                        Hide
                      </>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busyId === post.id}
                    onClick={() => handleDelete(post)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{post.content}</p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt=""
                  className="max-h-40 rounded-xl object-cover border border-slate-200"
                />
              )}
              <p className="text-[10px] text-slate-400">
                {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
