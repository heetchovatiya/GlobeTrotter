import React, { useState } from 'react';
import { CommunityPost } from '../../types';
import { Heart, MessageSquare, Send, MapPin, Share2, Copy, ExternalLink, Calendar, Route } from 'lucide-react';
import { communityApi } from '../../api/community';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Link } from 'react-router-dom';
import { Price } from '../common/Price';
import { Button } from '../common/Button';

interface CommunityPostCardProps {
  post: CommunityPost;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post }) => {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publicUrl = post.trip?.public_slug
    ? `${window.location.origin}/t/${post.trip.public_slug}`
    : null;

  const handleLike = async () => {
    try {
      const res = await communityApi.toggleLike(post.id);
      setIsLiked(res.is_liked);
      setLikesCount(res.likes_count);
    } catch {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('success', 'Itinerary link copied!');
    } catch {
      showToast('error', 'Could not copy link.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const updatedPost = await communityApi.addComment(post.id, newComment);
      setComments(updatedPost.comments || []);
      setNewComment('');
      showToast('success', 'Comment posted!');
    } catch {
      showToast('error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft p-5 sm:p-6 transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={
              post.user.profile_photo_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={post.user.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{post.user.name}</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {post.user.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" /> {post.user.city}, {post.user.country} •
                </span>
              )}
              <span>
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
        {post.trip && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
            <Route className="h-3 w-3" /> Itinerary
          </span>
        )}
      </div>

      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>

      {post.image_url && (
        <div className="rounded-2xl overflow-hidden max-h-96 w-full bg-slate-100">
          <img src={post.image_url} alt="Trip moment" className="w-full h-full object-cover" />
        </div>
      )}

      {post.trip && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-slate-50 border border-brand-100 p-4 space-y-3">
          <div className="flex items-start gap-3">
            {post.trip.cover_photo_url && (
              <img
                src={post.trip.cover_photo_url}
                alt={post.trip.name}
                className="h-16 w-16 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-brand-600 uppercase">Shared Itinerary</span>
              <h5 className="text-sm font-bold text-slate-900 line-clamp-1">{post.trip.name}</h5>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {post.trip.start_date} – {post.trip.end_date}
              </p>
              {post.trip.total_budget != null && post.trip.total_budget > 0 && (
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  Budget: <Price amount={post.trip.total_budget} />
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {publicUrl ? (
              <>
                <Link to={`/t/${post.trip.public_slug}`}>
                  <Button size="sm" variant="primary" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    View Full Itinerary
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                >
                  Copy Link
                </Button>
              </>
            ) : (
              <Link to={`/trips/${post.trip.id}`}>
                <Button size="sm" variant="outline" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  View Trip
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors ${
              isLiked ? 'text-rose-600 bg-rose-50' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowCommentBox(!showCommentBox)}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} Comments</span>
          </button>
        </div>
      </div>

      {showCommentBox && (
        <div className="pt-2 space-y-3 animate-fade-in border-t border-slate-100">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5 text-xs bg-slate-50 p-3 rounded-xl">
              <img
                src={
                  comment.user.profile_photo_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                }
                alt={comment.user.name}
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="flex-1">
                <span className="font-bold text-slate-900 mr-2">{comment.user.name}</span>
                <span className="text-slate-700">{comment.content}</span>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
