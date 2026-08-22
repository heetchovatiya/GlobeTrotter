import { apiClient } from './client';
import { mapCommunityPost } from './mappers';
import { CommunityComment, CommunityPost, TripStatus, User } from '../types';

type BackendPost = {
  id: number;
  user_id: number;
  trip_id?: number | null;
  content: string;
  image_url?: string | null;
  created_at: string;
  comment_count?: number;
  comments?: CommunityComment[];
  trip?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    cover_photo_url?: string | null;
    status: TripStatus;
    public_slug?: string | null;
    total_budget?: number | null;
  } | null;
};

export const communityApi = {
  async getPosts(sort: 'recent' | 'popular' = 'recent'): Promise<CommunityPost[]> {
    const posts = await apiClient<BackendPost[]>(`/community/posts?sort=${sort}`, {
      method: 'GET',
    });
    return posts.map((post) => mapCommunityPost(post));
  },

  async createPost(data: {
    content: string;
    image_url?: string;
    trip_id?: number;
  }): Promise<CommunityPost> {
    const post = await apiClient<BackendPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapCommunityPost(post);
  },

  async shareItinerary(data: {
    trip_id: number;
    content?: string;
    image_url?: string;
  }): Promise<CommunityPost> {
    const post = await apiClient<BackendPost>('/community/share-itinerary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapCommunityPost(post);
  },

  async addComment(postId: number, content: string): Promise<CommunityPost> {
    const post = await apiClient<BackendPost>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return mapCommunityPost(post);
  },

  async toggleLike(postId: number): Promise<{ is_liked: boolean; likes_count: number }> {
    return { is_liked: false, likes_count: 0 };
  },
};

export function enrichCommunityPosts(
  posts: CommunityPost[],
  currentUser: User | null
): CommunityPost[] {
  if (!currentUser) return posts;
  return posts.map((post) => ({
    ...post,
    user:
      post.user_id === currentUser.id
        ? {
            id: currentUser.id,
            name: currentUser.name,
            city: currentUser.city,
            country: currentUser.country,
            profile_photo_url: currentUser.profile_photo_url,
          }
        : post.user,
    comments: post.comments?.map((comment) => ({
      ...comment,
      user:
        comment.user_id === currentUser.id
          ? {
              id: currentUser.id,
              name: currentUser.name,
              profile_photo_url: currentUser.profile_photo_url,
            }
          : comment.user,
    })),
  }));
}
