// Strip HTML tags from a string
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// Estimate read time in minutes (200 words per minute, minimum 1)
export function readTime(content: string): number {
  return Math.max(1, Math.ceil(stripHtml(content).split(' ').length / 200));
}

// Get the first letter of a display name or username, uppercased
export function authorInitial(displayName?: string | null, username?: string | null, fallback = '?'): string {
  return (displayName || username || fallback)[0].toUpperCase();
}

// Get the display date for a blog (publishedAt if available, else createdAt)
export function blogDate(publishedAt?: string | null, createdAt?: string): Date {
  return new Date(publishedAt || createdAt || Date.now());
}

// Extract the src of the first <img> tag in an HTML string
export function extractFirstImage(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}
