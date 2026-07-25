import { apiFetch } from './api-client';

export type UserRole = 'CAJERA' | 'JEFA';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

const TOKEN_KEY = 'pos_token';
const USER_KEY = 'pos_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(data: LoginResponse): void {
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuth(data);
  return data;
}

export async function getProfile(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', {}, token);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    '/auth/password',
    {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    getToken(),
  );
}

export function isJefa(user: AuthUser | null): boolean {
  return user?.role === 'JEFA';
}

export function isCajera(user: AuthUser | null): boolean {
  return user?.role === 'CAJERA';
}
