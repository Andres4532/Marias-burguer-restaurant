import { Injectable } from '@nestjs/common';
import { ProductSauceMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapProductPromoFields } from '../common/utils/product-pricing.util';

export type CatalogSauce = {
  id: string;
  name: string;
};

export type CatalogResponse = {
  categories: Array<{
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
      sauces: CatalogSauce[];
    }>;
  }>;
};

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCatalog(): Promise<CatalogResponse> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { deletedAt: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            sauces: {
              include: {
                sauce: {
                  select: { id: true, name: true, isActive: true, sortOrder: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products.map((product) => {
          const promo = mapProductPromoFields(product);
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            price: promo.price,
            effectivePrice: promo.effectivePrice,
            hasPromotion: promo.hasPromotion,
            promoLabel: promo.promoLabel,
            imageUrl: product.imageUrl,
            sortOrder: product.sortOrder,
            trackStock: product.trackStock,
            stockQuantity: product.stockQuantity,
            sauceMode: product.sauceMode,
            allowSauceSeparate: product.allowSauceSeparate,
            sauces: product.sauces
              .map((entry) => entry.sauce)
              .filter((sauce) => sauce.isActive)
              .sort(
                (a, b) =>
                  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
              )
              .map((sauce) => ({ id: sauce.id, name: sauce.name })),
          };
        }),
      })),
    };
  }
}
