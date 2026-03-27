export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // Minimum 8 characters
  return password.length >= 8;
}

export function validateUsername(username: string): boolean {
  // Alphanumeric and underscore only, 3-30 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

export function validateBlogTitle(title: string): boolean {
  // Title should be 3-255 characters
  return title.length >= 3 && title.length <= 255;
}

export function validateBlogContent(content: string): boolean {
  // Content should be at least 10 characters
  return content.length >= 10;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, ' ');
}
