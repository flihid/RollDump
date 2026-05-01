export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

const KEY_TOKEN = 'access_token';
const KEY_REFRESH = 'refresh_token';
const KEY_USER = 'user';

export function getToken(): string | null {
  return localStorage.getItem(KEY_TOKEN);
}
export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function setAuth(token: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(KEY_TOKEN, token);
  localStorage.setItem(KEY_REFRESH, refreshToken);
  localStorage.setItem(KEY_USER, JSON.stringify(user));
}
export function clearAuth() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_USER);
}
export function isLoggedIn() {
  return !!getToken();
}
export function isAdmin() {
  const u = getUser();
  return u && (u.role === 'admin' || u.role === 'super_admin' || u.role === 'moderator');
}
