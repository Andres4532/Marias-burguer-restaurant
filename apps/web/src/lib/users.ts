import { apiFetch } from './api-client';
import { getToken } from './auth';
import type { UserRole } from './auth';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

function token() {
  return getToken();
}

export const getUsers = () =>
  apiFetch<AppUser[]>('/users', {}, token());

export const createUser = (data: CreateUserInput) =>
  apiFetch<AppUser>('/users', { method: 'POST', body: JSON.stringify(data) }, token());

export const updateUser = (id: string, data: UpdateUserInput) =>
  apiFetch<AppUser>(
    `/users/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    token(),
  );

export const resetUserPassword = (id: string, password: string) =>
  apiFetch<{ message: string }>(
    `/users/${id}/password`,
    { method: 'PATCH', body: JSON.stringify({ password }) },
    token(),
  );

export const ROLE_LABELS: Record<UserRole, string> = {
  JEFA: 'Jefa',
  CAJERA: 'Cajera',
};
