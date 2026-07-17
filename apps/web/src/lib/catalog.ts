import { apiFetch, parseApiError } from './api-client';
import { getToken } from './auth';
import type {
  Category,
  Extra,
  Product,
  CatalogCategory,
  CreateCategoryInput,
  CreateExtraInput,
  CreateProductInput,
} from '@/types/catalog';

function token() {
  return getToken();
}

// Categories
export const getCategories = (all = true) =>
  apiFetch<Category[]>(`/categories?all=${all}`, {}, token());

export const createCategory = (data: CreateCategoryInput) =>
  apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }, token());

export const updateCategory = (id: string, data: Partial<CreateCategoryInput>) =>
  apiFetch<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token());

export const deleteCategory = (id: string, removeProducts = false) =>
  apiFetch<{ message: string; removedProducts?: number }>(
    `/categories/${id}?removeProducts=${removeProducts}`,
    { method: 'DELETE' },
    token(),
  );

// Extras
export const getExtras = (all = true) =>
  apiFetch<Extra[]>(`/extras?all=${all}`, {}, token());

export const createExtra = (data: CreateExtraInput) =>
  apiFetch<Extra>('/extras', { method: 'POST', body: JSON.stringify(data) }, token());

export const updateExtra = (id: string, data: Partial<CreateExtraInput>) =>
  apiFetch<Extra>(`/extras/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token());

export const deleteExtra = (id: string) =>
  apiFetch<{ message: string }>(`/extras/${id}`, { method: 'DELETE' }, token());

// Products
export const getProducts = (categoryId?: string, all = true) => {
  const params = new URLSearchParams({ all: String(all) });
  if (categoryId) params.set('categoryId', categoryId);
  return apiFetch<Product[]>(`/products?${params}`, {}, token());
};

export const createProduct = (data: CreateProductInput) =>
  apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, token());

export const updateProduct = (id: string, data: Partial<CreateProductInput>) =>
  apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token());

export const deleteProduct = (id: string) =>
  apiFetch<{ message: string }>(`/products/${id}`, { method: 'DELETE' }, token());

// Catalog (POS)
export const getCatalog = () =>
  apiFetch<CatalogCategory[]>('/catalog', {}, token());

export function formatPrice(price: number): string {
  return `Bs. ${price.toFixed(2)}`;
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error);
}
