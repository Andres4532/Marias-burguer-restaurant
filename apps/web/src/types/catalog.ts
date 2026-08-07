export type ProductPromoType = 'NONE' | 'PERCENT' | 'FIXED_PRICE';
export type ProductSauceMode = 'NONE' | 'SINGLE' | 'MULTIPLE';
export type SaucePlacement = 'ON_PRODUCT' | 'SEPARATE';

export interface Sauce {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSauceOption {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  price: number;
  effectivePrice: number;
  hasPromotion: boolean;
  promoType: ProductPromoType;
  promoValue: number | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  promoLabel: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  trackStock: boolean;
  stockQuantity: number;
  sauceMode: ProductSauceMode;
  allowSauceSeparate: boolean;
  sauces: ProductSauceOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogResponse {
  categories: CatalogCategory[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  sortOrder: number;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    effectivePrice: number;
    hasPromotion: boolean;
    promoLabel: string | null;
    imageUrl: string | null;
    sortOrder: number;
    trackStock: boolean;
    stockQuantity: number;
    sauceMode: ProductSauceMode;
    allowSauceSeparate: boolean;
    sauces: ProductSauceOption[];
  }>;
}

export interface CreateCategoryInput {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
  trackStock?: boolean;
  stockQuantity?: number;
  promoType?: ProductPromoType;
  promoValue?: number;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  sauceMode?: ProductSauceMode;
  allowSauceSeparate?: boolean;
  sauceIds?: string[];
}

export interface CreateSauceInput {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}
