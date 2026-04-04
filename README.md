# BlogHub — Project Documentation

A full-stack blog publishing platform with a rich text editor, section-based content builder, user authentication, social interactions (likes, comments, follows), and infinite scroll feed.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Authentication](#authentication)
5. [Backend API](#backend-api)
6. [Frontend Architecture](#frontend-architecture)
7. [Components](#components)
8. [Blog Editor](#blog-editor)
9. [Environment Variables](#environment-variables)
10. [Running Locally](#running-locally)
11. [Deployment](#deployment)
12. [TypeScript Types](#typescript-types)
13. [Color & Font System](#color--font-system)

---

## Tech Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| Frontend     | Next.js 14 (App Router), React 18, TypeScript       |
| Styling      | Tailwind CSS v3, `@tailwindcss/typography`          |
| Rich Editor  | TipTap v2 (ProseMirror-based)                       |
| Backend      | Express.js, TypeScript                              |
| Database     | MySQL 8 (`mysql2/promise` connection pool)          |
| Auth         | JWT (httpOnly cookies) + bcryptjs                   |
| File Storage | Vercel Blob (`@vercel/blob`)                        |
| Fonts        | Nunito (Google Fonts), New Kansas (self-hosted)     |
| Deployment   | Frontend → Vercel · Backend → Railway               |

---

## Project Structure

```
blogs/
├── frontend/                          # Next.js 14 application
│   ├── public/
│   │   └── fonts/NewKansas/           # Self-hosted font files (woff2 + woff)
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx             # Root layout — providers, Nunito font
│   │   │   ├── page.tsx               # Landing / home page
│   │   │   ├── auth/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── blogs/
│   │   │   │   ├── page.tsx           # Infinite scroll blog feed + search
│   │   │   │   ├── new/page.tsx       # Create new blog
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx       # Blog detail (SSR)
│   │   │   │       └── edit/page.tsx  # Edit blog (owner only)
│   │   │   ├── dashboard/page.tsx     # My blogs dashboard
│   │   │   ├── users/[username]/page.tsx  # Public user profile
│   │   │   └── api/upload/route.ts    # Next.js API route — Vercel Blob upload
│   │   ├── components/                # 23 reusable React components
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Global auth state + actions
│   │   │   └── SidebarContext.tsx     # Sidebar open/close state
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios client with auto token refresh
│   │   │   └── utils.ts               # readTime, blogDate, authorInitial
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces
│   │   └── styles/
│   │       └── globals.css            # Tailwind directives, fonts, drag styles
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── backend/                           # Express.js REST API
│   ├── src/
│   │   ├── app.ts                     # Entry — CORS, middleware, routes
│   │   ├── config/
│   │   │   └── database.ts            # MySQL pool + auto schema creation
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── blogController.ts
│   │   │   └── importController.ts    # Excel (.xlsx) import logic
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT guard + optional auth
│   │   │   └── errorHandler.ts        # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.ts                # /api/auth/*
│   │   │   ├── blogs.ts               # /api/blogs/*
│   │   │   ├── users.ts               # /api/users/*
│   │   │   └── interactions.ts        # Likes, comments, follows
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── blogService.ts
│   │   │   ├── userService.ts
│   │   │   └── interactionService.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts                 # Token generation + verification
│   │   │   ├── password.ts            # bcryptjs helpers
│   │   │   └── validation.ts          # express-validator chains
│   │   └── scripts/
│   │       └── seed.ts                # Seeds 50 sample blogs
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                       # Monorepo root scripts
├── railpack.json                      # Railway deployment config
└── README.md
```

---

## Database Schema

The schema is **auto-created on backend startup** via `database.ts` — no migrations or manual setup needed.

### `users`

| Column                | Type         | Notes                         |
|-----------------------|--------------|-------------------------------|
| `id`                  | VARCHAR(36)  | UUID, Primary Key             |
| `username`            | VARCHAR(255) | Unique                        |
| `email`               | VARCHAR(255) | Unique                        |
| `passwordHash`        | VARCHAR(255) | bcryptjs, cost factor 10      |
| `displayName`         | VARCHAR(255) | Nullable                      |
| `bio`                 | TEXT         | Nullable                      |
| `avatar`              | VARCHAR(500) | Nullable — URL                |
| `passwordResetToken`  | VARCHAR(255) | Nullable                      |
| `passwordResetExpiry` | DATETIME     | Nullable, 1-hour window       |
| `createdAt`           | TIMESTAMP    | Auto                          |
| `updatedAt`           | TIMESTAMP    | Auto-updated on change        |

### `blogs`

| Column        | Type         | Notes                                   |
|---------------|--------------|-----------------------------------------|
| `id`          | VARCHAR(36)  | UUID, Primary Key                       |
| `userId`      | VARCHAR(36)  | FK → users.id                           |
| `title`       | VARCHAR(255) |                                         |
| `slug`        | VARCHAR(255) | Unique, auto-generated via `slugify`    |
| `content`     | LONGTEXT     | Raw HTML (TipTap + encoded sections)    |
| `excerpt`     | TEXT         | Nullable                                |
| `status`      | VARCHAR(20)  | `'draft'` or `'published'`              |
| `viewCount`   | INT          | Default 0, incremented on slug GET      |
| `publishedAt` | DATETIME     | Set when status becomes `'published'`   |
| `createdAt`   | TIMESTAMP    | Auto                                    |
| `updatedAt`   | TIMESTAMP    | Auto-updated                            |

### `blog_likes`

| Column      | Type        | Notes                |
|-------------|-------------|----------------------|
| `blogId`    | VARCHAR(36) | FK → blogs.id        |
| `userId`    | VARCHAR(36) | FK → users.id        |
| `createdAt` | TIMESTAMP   | Auto                 |
| PK          |             | (blogId, userId)     |

### `blog_comments`

| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| `id`        | VARCHAR(36) | UUID, Primary Key              |
| `blogId`    | VARCHAR(36) | FK → blogs.id                  |
| `userId`    | VARCHAR(36) | FK → users.id                  |
| `content`   | TEXT        |                                |
| `parentId`  | VARCHAR(36) | Nullable — for nested replies  |
| `createdAt` | TIMESTAMP   | Auto                           |

### `user_follows`

| Column        | Type        | Notes                        |
|---------------|-------------|------------------------------|
| `followerId`  | VARCHAR(36) | FK → users.id                |
| `followingId` | VARCHAR(36) | FK → users.id                |
| `createdAt`   | TIMESTAMP   | Auto                         |
| PK            |             | (followerId, followingId)    |

---

## Authentication

### Strategy
- **Access Token** — JWT, 15-minute expiry, `httpOnly` cookie named `accessToken`
- **Refresh Token** — JWT, 7-day expiry, `httpOnly` cookie named `refreshToken`
- Both cookies: `httpOnly: true`, `sameSite: 'none'`, `secure: true` in production
- No tokens stored in `localStorage` or exposed to JavaScript

### Token Payload
```json
{ "id": "uuid", "email": "user@example.com", "username": "johndoe" }
```

### Auto-Refresh Flow

The Axios client (`lib/api.ts`) intercepts every `401 Unauthorized`:
1. Calls `POST /api/auth/refresh` — uses the `refreshToken` cookie
2. If successful → retries the original request transparently
3. If failed → clears auth state, redirects to `/auth/login`

### Password Reset
1. `POST /api/auth/forgot-password` — generates a reset token (1-hour expiry), stores hash in DB
2. In development: token returned directly in response body
3. In production: should be emailed (email service not yet integrated)
4. `POST /api/auth/reset-password` — validates token expiry, updates password hash

### Rate Limiting
- `/register` and `/login`: 10 requests per 15 minutes per IP

---

## Backend API

Base URL: `http://localhost:5000/api`

### Auth — `/api/auth`

| Method | Route               | Auth | Description                          |
|--------|---------------------|------|--------------------------------------|
| POST   | `/register`         | —    | Create account                       |
| POST   | `/login`            | —    | Validate credentials, set cookies    |
| GET    | `/me`               | ✓    | Get current user from access token   |
| POST   | `/refresh`          | —    | Issue new access token               |
| POST   | `/logout`           | —    | Clear both cookies                   |
| POST   | `/forgot-password`  | —    | Request password reset token         |
| POST   | `/reset-password`   | —    | Reset password with token            |

### Blogs — `/api/blogs`

| Method | Route         | Auth     | Description                              |
|--------|---------------|----------|------------------------------------------|
| GET    | `/`           | Optional | Published blogs — paginated + searchable |
| GET    | `/slug/:slug` | Optional | Blog by slug, increments `viewCount`     |
| GET    | `/:id`        | Optional | Blog by ID                               |
| POST   | `/`           | ✓        | Create blog                              |
| PUT    | `/:id`        | ✓ Owner  | Update blog (title, content, status)     |
| DELETE | `/:id`        | ✓ Owner  | Delete blog                              |
| GET    | `/user/me`    | ✓        | My blogs (all statuses, paginated)       |
| POST   | `/import`     | ✓        | Bulk import from `.xlsx` (5 MB limit)    |

**Query params:** `?page=1&limit=9&search=keyword`

**Standard response envelope:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 9,
    "totalPages": 6
  }
}
```

### Interactions

| Method | Route                       | Auth | Description                    |
|--------|-----------------------------|------|--------------------------------|
| POST   | `/blogs/:blogId/like`       | ✓    | Like a blog                    |
| DELETE | `/blogs/:blogId/like`       | ✓    | Unlike a blog                  |
| GET    | `/blogs/:blogId/likes`      | Opt  | Like count + authenticated status |
| POST   | `/blogs/:blogId/comments`   | ✓    | Add comment (supports `parentId`) |
| GET    | `/blogs/:blogId/comments`   | —    | Threaded comments              |
| DELETE | `/comments/:commentId`      | ✓    | Delete own comment             |
| POST   | `/users/:userId/follow`     | ✓    | Follow user                    |
| DELETE | `/users/:userId/follow`     | ✓    | Unfollow user                  |
| GET    | `/users/:userId/follow`     | Opt  | Follow status + follower count |

### Users — `/api/users`

| Method | Route         | Auth | Description                    |
|--------|---------------|------|--------------------------------|
| GET    | `/:username`  | —    | Public profile + published blogs |
| PUT    | `/me`         | ✓    | Update displayName, bio, avatar |

---

## Frontend Architecture

### Provider Hierarchy

```
RootLayout (app/layout.tsx)
└── AuthProvider              ← useAuth() — user state, login/logout/register
    └── SidebarProvider       ← useSidebar() — sidebar open/close
        ├── Navbar
        ├── AppSidebar
        └── MainWrapper
            └── {page content}
```

### AuthContext — `useAuth()`

```typescript
const {
  user,              // User | null
  isLoading,         // true during initial /me check on mount
  isAuthenticated,   // shorthand for !!user
  login,             // (email, password) => Promise<void>
  register,          // (username, email, password, displayName?) => Promise<void>
  logout,            // () => Promise<void>
  updateUser,        // (patch: Partial<User>) => void — local state only
} = useAuth();
```

### API Client — `lib/api.ts`

Axios instance configured with:
- `baseURL = process.env.NEXT_PUBLIC_API_URL`
- `withCredentials: true` (sends cookies on every cross-origin request)
- Response interceptor: auto-refresh on `401`, retry original request

All methods return the full Axios response — callers access `res.data.data`.

### Utility Functions — `lib/utils.ts`

```typescript
readTime(html: string): number           // estimated read time in minutes
blogDate(publishedAt, createdAt): Date   // best available date
authorInitial(displayName, username, fallback): string  // first letter for avatar
```

---

## Components

### Layout Components

| Component         | Description                                           |
|-------------------|-------------------------------------------------------|
| `Navbar`          | Top bar — logo, nav links, user avatar menu           |
| `AppSidebar`      | Left sidebar — navigation links, collapsible          |
| `MainWrapper`     | Shifts content right when sidebar is open             |
| `ProfileDropdown` | User dropdown — dashboard, logout                     |

### Blog Components

| Component                  | Description                                                   |
|----------------------------|---------------------------------------------------------------|
| `BlogCard`                 | Feed card — title, excerpt, author, read time, views          |
| `BlogEditor`               | Title + excerpt inputs + RichTextEditor wrapper               |
| `RichTextEditor`           | TipTap WYSIWYG — fonts, formatting, images, HTML blocks       |
| `HtmlBlockExtension`       | Custom TipTap node type for raw HTML sections                 |
| `HtmlBlockView`            | React NodeView — renders, edits, and drag-reorders sections   |
| `SectionTemplates`         | Grid of pre-built HTML section layouts to insert              |
| `ResizableImageExtension`  | TipTap extension — 8-handle drag-to-resize for images         |
| `BlogInteractions`         | Likes + comments drawer on blog detail page                   |
| `LikeCommentShare`         | Action buttons with counts                                    |
| `CommentsSection`          | Nested threaded comment tree                                  |
| `CollapsibleTOC`           | Auto-generates table of contents from heading tags            |
| `ZoomableImage`            | Click to open image in full-screen overlay                    |
| `ZoomableContent`          | Wraps blog body HTML — makes all `<img>` tags zoomable        |
| `ImportBlogsModal`         | Upload `.xlsx` to bulk-create blogs                           |

### User Components

| Component        | Description                                            |
|------------------|--------------------------------------------------------|
| `LoginForm`      | Email + password form                                  |
| `RegisterForm`   | Username + email + password form                       |
| `FollowButton`   | Follow/unfollow toggle with follower count             |
| `ProfileClient`  | Profile header — avatar, bio, stats                    |
| `Pagination`     | Page navigation (used in dashboard)                    |

---

## Blog Editor

The editor is a two-layer system:

### Layer 1 — TipTap (`RichTextEditor.tsx`)

Standard ProseMirror WYSIWYG for flowing prose content:
- Inline: Bold, italic, underline, strikethrough, inline code
- Blocks: Headings (H1–H3), paragraphs, bullet lists, ordered lists
- Blockquotes, fenced code blocks, horizontal rules
- Links, inline images with resize extension
- Font family and font size via `TextStyle` extension
- **Default font:** Times New Roman 16px

### Layer 2 — HTML Sections (`HtmlBlockView.tsx`)

Custom TipTap node (`htmlBlock`) embedding rich self-contained HTML blocks:

**Editing:**
- Each section opens into an isolated `contentEditable` div
- Full per-section toolbar: font family, font size, bold, italic, underline, strike, H1/H2/H3, alignment, bullet/numbered lists, text color
- Browser UA contenteditable margin overrides neutralized via high-specificity CSS rule (`.section-edit-area[contenteditable] p`)
- `Esc` to cancel, Save button to commit, Duplicate and Delete actions

**Images:**
- Click placeholder → triggers file upload to Vercel Blob
- Click uploaded image → 8-handle resize overlay appears
- Drag handles: NW/N/NE/E/SE/S/SW/W corners
- Percentage size presets: 25%, 50%, 75%, 100%
- Real-time W×H badge during drag

**Drag-to-Reorder:**
- No HTML5 drag API — uses raw `mousemove` / `mouseup` on `document`
- `requestAnimationFrame` batches state updates for 60fps rendering
- Symmetric midpoint threshold: sections swap when cursor crosses 50% of any neighbour, same sensitivity dragging up or down
- Sections compress to 64px `maxHeight` during drag
- Surrounding sections shift via CSS `translateY` (150ms cubic-bezier)
- Dragged section: glowing primary-color ring + deep shadow
- Other sections: warm translucent overlay via `::before` pseudo-element hides all content/buttons
- `+` insert buttons suppressed during any drag (`anyDragging` state)

### Section Templates (`SectionTemplates.tsx`)

Pre-built HTML layouts grouped by category:

| Category        | Templates                                                   |
|-----------------|-------------------------------------------------------------|
| Image + Text    | Image Top, Image Bottom, Image Left, Image Right            |
| Layouts         | Two Images, Three Images, Banner, Side-by-Side              |
| Content Blocks  | Pull Quote, Stats Row, Feature Cards, Timeline, CTA         |

### Content Storage / Encoding

Section HTML is stored in ProseMirror as:
```html
<div data-html-block="<encoded>" contenteditable="false"></div>
```
where `<encoded>` = `encodeURIComponent(rawHtml)`.

On blog detail page and preview, these are decoded back with:
```js
html.replace(/<div data-html-block="([^"]*)"[^>]*><\/div>/g,
  (_, enc) => decodeURIComponent(enc))
```

---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
NODE_ENV=development

# MySQL connection (individual vars OR MYSQL_URL)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=bloghub
MYSQL_PORT=3306
MYSQL_SSL=false

# JWT secrets — use long random strings (32+ chars)
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- MySQL 8 (local or remote)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Fill in MySQL credentials and JWT secrets
```

### 3. Start backend

```bash
cd backend
npm run dev      # nodemon hot-reload on port 5000
```

The MySQL schema is created automatically on first startup.

### 4. Seed sample data (optional)

```bash
cd backend
npx ts-node src/scripts/seed.ts
# Creates a test user and 50 sample blogs
```

### 5. Configure and start frontend

```bash
cd frontend
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# BLOB_READ_WRITE_TOKEN=<your-vercel-blob-token>
npm run dev      # http://localhost:3000
```

---

## Deployment

### Frontend → Vercel

1. Connect the `frontend/` folder as a Vercel project
2. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → Railway backend URL
   - `BLOB_READ_WRITE_TOKEN` → from Vercel Blob dashboard
3. Vercel auto-detects Next.js — no config needed

### Backend → Railway

1. Connect repo root to a Railway project
2. `railpack.json` configures build and start commands:
   - Build: `cd backend && npm install && npm run build`
   - Start: `cd backend && npm start`
3. Add a Railway MySQL plugin and link it to the backend service
4. Set all backend env vars in Railway dashboard
5. Set `FRONTEND_URL` to your Vercel app URL

### CORS

The backend accepts requests from:
- The exact `FRONTEND_URL` from env
- Any `*.vercel.app` subdomain (Vercel preview deployments)
- `http://localhost:3000` (development)

---

## TypeScript Types

```typescript
// User
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Blog
interface Blog {
  id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;         // raw HTML
  excerpt?: string;
  status: 'draft' | 'published';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface BlogWithAuthor extends Blog {
  author?: User;
}

// Comments
interface Comment {
  id: string;
  blogId: string;
  userId: string;
  content: string;
  parentId?: string;
  createdAt: string;
  author?: User;
  replies?: Comment[];
}

// API shape
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface JwtPayload {
  id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
```

---

## Color & Font System

### Colors

Defined as CSS HSL variables in `globals.css` to enable Tailwind opacity modifiers (`bg-primary/10`, `text-primary-dark`, etc.):

```css
:root {
  --primary:       340 50% 45%;   /* #AC2660 — base brand */
  --primary-light: 340 45% 55%;   /* #C04878 — buttons, links */
  --primary-dark:  340 55% 35%;   /* #8A1748 — hover states  */
}
```

Usage: `bg-primary`, `bg-primary-light`, `text-primary-dark`, `border-primary/30`, `bg-primary/10`, etc.

Configured in `tailwind.config.js` with `<alpha-value>` interpolation:
```js
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
    light:   'hsl(var(--primary-light) / <alpha-value>)',
    dark:    'hsl(var(--primary-dark) / <alpha-value>)',
  }
}
```

### Fonts

```
Nunito (Google Fonts, via next/font/google)
  Weights: 300, 400, 600, 700, 800
  Variable: --font-nunito
  Usage: body, all UI text

New Kansas (self-hosted, /public/fonts/NewKansas/)
  Weights: 100, 400, 500, 600, 700, 800
  Format: woff2 + woff
  Usage: .font-kansas utility class

Times New Roman (system)
  Usage: default font inside the section HTML editor
```
