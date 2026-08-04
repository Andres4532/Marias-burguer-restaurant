import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { mapProductPromoFields } from '../common/utils/product-pricing.util';

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
          };
        }),
      })),
    };
  }
}
