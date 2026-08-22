import { apiClient } from './client';
import { CommunityPost, CommunityComment } from '../types';
import { MOCK_COMMUNITY_POSTS, MOCK_CURRENT_USER } from './mockData';

export const communityApi = {
  async getPosts(sort: 'recent' | 'popular' = 'recent'): Promise<CommunityPost[]> {
    let posts = [...MOCK_COMMUNITY_POSTS];
    if (sort === 'popular') {
      posts.sort((a, b) => b.likes_count - a.likes_count);
    } else {
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return apiClient<CommunityPost[]>(`/community/posts?sort=${sort}`, {
      method: 'GET',
      fallbackData: posts,
    });
  },

  async createPost(data: { content: string; image_url?: string; trip_id?: number }): Promise<CommunityPost> {
    const newPost: CommunityPost = {
      id: Math.floor(Math.random() * 9000) + 100,
      user_id: MOCK_CURRENT_USER.id,
      content: data.content,
      image_url: data.image_url,
      trip_id: data.trip_id,
      created_at: new Date().toISOString(),
      user: {
        id: MOCK_CURRENT_USER.id,
        name: MOCK_CURRENT_USER.name,
        city: MOCK_CURRENT_USER.city,
        country: MOCK_CURRENT_USER.country,
        profile_photo_url: MOCK_CURRENT_USER.profile_photo_url,
      },
      likes_count: 0,
      is_liked: false,
      comments: [],
    };

    MOCK_COMMUNITY_POSTS.unshift(newPost);

    return apiClient<CommunityPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackData: newPost,
    });
  },

  async addComment(postId: number, content: string): Promise<CommunityComment> {
    const newComment: CommunityComment = {
      id: Math.floor(Math.random() * 9000) + 100,
      post_id: postId,
      user_id: MOCK_CURRENT_USER.id,
      content,
      created_at: new Date().toISOString(),
      user: {
        id: MOCK_CURRENT_USER.id,
        name: MOCK_CURRENT_USER.name,
        profile_photo_url: MOCK_CURRENT_USER.profile_photo_url,
      },
    };

    const targetPost = MOCK_COMMUNITY_POSTS.find((p) => p.id === postId);
    if (targetPost) {
      targetPost.comments.push(newComment);
    }

    return apiClient<CommunityComment>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      fallbackData: newComment,
    });
  },

  async toggleLike(postId: number): Promise<{ is_liked: boolean; likes_count: number }> {
    const post = MOCK_COMMUNITY_POSTS.find((p) => p.id === postId);
    if (post) {
      post.is_liked = !post.is_liked;
      post.likes_count += post.is_liked ? 1 : -1;
      return { is_liked: post.is_liked, likes_count: post.likes_count };
    }
    return { is_liked: true, likes_count: 1 };
  },
};

