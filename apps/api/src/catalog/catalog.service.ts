import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toNumber } from '../common/utils/decimal.util';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCatalog() {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { deletedAt: null, isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            extras: {
              include: {
                extra: true,
              },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: toNumber(product.price),
        imageUrl: product.imageUrl,
        sortOrder: product.sortOrder,
        extras: product.extras
          .filter((pe) => pe.extra.deletedAt === null && pe.extra.isActive)
          .map((pe) => ({
            id: pe.extra.id,
            name: pe.extra.name,
            price: toNumber(pe.extra.price),
          })),
      })),
    }));
  }
}
