// User types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash?: string;
}

export interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequestBody {
  emailOrUsername: string;
  password: string;
}

// Blog types
export interface Blog {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BlogWithAuthor extends Blog {
  author?: User;
}

export interface CreateBlogRequestBody {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogRequestBody {
  title?: string;
  content?: string;
  excerpt?: string;
  status?: 'draft' | 'published';
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

// Comment types (optional)
export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Response
export interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
