export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  extras?: ProductExtra[];
  createdAt: string;
  updatedAt: string;
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
    imageUrl: string | null;
    sortOrder: number;
    extras: Array<{ id: string; name: string; price: number }>;
  }>;
}

export interface CreateCategoryInput {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateExtraInput {
  name: string;
  price: number;
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
  extraIds?: string[];
}
