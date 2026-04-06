import axios, { AxiosInstance } from 'axios';

// In production, requests go to /api/* which Next.js proxies to the backend
// via next.config.js rewrites — this keeps cookies same-origin.
// In local dev, NEXT_PUBLIC_API_URL is used directly (e.g. http://localhost:5000/api).
const baseURL =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL;

const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-refresh access token on 401, then retry the original request once
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(null)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      // Don't attempt refresh for the initial auth probe — it's expected to 401 for guests
      if (original.url?.endsWith('/auth/me')) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(original)).catch((e) => Promise.reject(e));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await apiClient.post('/auth/refresh', {});
        processQueue(null);
        return apiClient(original);
      } catch {
        processQueue(new Error('Session expired'));
        // Fire a global event so AuthContext can clear state and redirect
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// API endpoints
export const api = {
  // Auth
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: { emailOrUsername: string; password: string }) => apiClient.post('/auth/login', data),
  verifyEmail: (token: string) => apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (emailOrUsername: string) => apiClient.post('/auth/resend-verification', { emailOrUsername }),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  refreshToken: (data: any) => apiClient.post('/auth/refresh', data),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => apiClient.post('/auth/reset-password', { token, password }),

  // Blogs (to be implemented)
  getBlogs: (page?: number, limit?: number, search?: string) =>
    apiClient.get('/blogs', { params: { page, limit, search } }),
  getBlogById: (id: string) => apiClient.get(`/blogs/${id}`),
  getBlogBySlug: (slug: string) => apiClient.get(`/blogs/slug/${slug}`),
  createBlog: (data: any) => apiClient.post('/blogs', data),
  updateBlog: (id: string, data: any) => apiClient.put(`/blogs/${id}`, data),
  deleteBlog: (id: string) => apiClient.delete(`/blogs/${id}`),
  importBlogs: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/blogs/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getMyBlogs: (page?: number, limit?: number) =>
    apiClient.get('/blogs/user/me', { params: { page, limit } }),
  getUserBlogs: (userId: string) => apiClient.get(`/blogs/user/${userId}`),

  // Users
  getUserProfile: (username: string) => apiClient.get(`/users/${username}`),
  getUserPublishedBlogs: (userId: string) => apiClient.get(`/users/${userId}/blogs`),
  updateProfile: (data: { displayName?: string; bio?: string; avatar?: string }) =>
    apiClient.put('/users/me', data),

  // Likes
  getLikeStatus: (blogId: string) => apiClient.get(`/blogs/${blogId}/likes`),
  likeBlog: (blogId: string) => apiClient.post(`/blogs/${blogId}/like`),
  unlikeBlog: (blogId: string) => apiClient.delete(`/blogs/${blogId}/like`),

  // Comments
  getComments: (blogId: string) => apiClient.get(`/blogs/${blogId}/comments`),
  addComment: (blogId: string, content: string, parentId?: string) => apiClient.post(`/blogs/${blogId}/comments`, { content, parentId }),
  deleteComment: (commentId: string) => apiClient.delete(`/comments/${commentId}`),

  // Follows
  getFollowStatus: (userId: string) => apiClient.get(`/users/${userId}/follow`),
  followUser: (userId: string) => apiClient.post(`/users/${userId}/follow`),
  unfollowUser: (userId: string) => apiClient.delete(`/users/${userId}/follow`),
};

export default apiClient;