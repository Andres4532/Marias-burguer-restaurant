import { apiFetch } from './api-client';
import { getToken } from './auth';
import type { Sauce, CreateSauceInput } from '@/types/catalog';
import { getErrorMessage } from './catalog';

function token() {
  return getToken();
}

export const getSauces = (all = true) =>
  apiFetch<Sauce[]>(`/sauces?all=${all}`, {}, token());

export const createSauce = (data: CreateSauceInput) =>
  apiFetch<Sauce>('/sauces', { method: 'POST', body: JSON.stringify(data) }, token());

export const updateSauce = (id: string, data: Partial<CreateSauceInput>) =>
  apiFetch<Sauce>(`/sauces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token());

export const deleteSauce = (id: string) =>
  apiFetch<{ message: string }>(`/sauces/${id}`, { method: 'DELETE' }, token());

export { getErrorMessage };
