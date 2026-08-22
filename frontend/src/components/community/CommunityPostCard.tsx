import React, { useState } from 'react';
import { CommunityPost } from '../../types';
import { Heart, MessageSquare, Send, MapPin, Share2 } from 'lucide-react';
import { communityApi } from '../../api/community';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Link } from 'react-router-dom';

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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const added = await communityApi.addComment(post.id, newComment);
      setComments([...comments, added]);
      setNewComment('');
      showToast('success', 'Comment posted!');
    } catch (err: any) {
      showToast('error', 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-soft p-5 sm:p-6 transition-all space-y-4">
      {/* Author Header */}
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
              <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Text */}
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Post Image (if any) */}
      {post.image_url && (
        <div className="rounded-2xl overflow-hidden max-h-96 w-full bg-slate-100">
          <img
            src={post.image_url}
            alt="Trip moment"
            className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      )}

      {/* Attached Trip Preview (if linked) */}
      {post.trip && (
        <Link
          to={`/trips/${post.trip.id}`}
          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-brand-50/50 hover:border-brand-200 transition-colors"
        >
          {post.trip.cover_photo_url && (
            <img
              src={post.trip.cover_photo_url}
              alt={post.trip.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <span className="text-[10px] font-bold text-brand-600 uppercase">Attached Itinerary</span>
            <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{post.trip.name}</h5>
          </div>
        </Link>
      )}

      {/* Action Bar */}
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
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} Comments</span>
          </button>
        </div>
      </div>

      {/* Comments Thread */}
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

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts or recommendations..."
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

