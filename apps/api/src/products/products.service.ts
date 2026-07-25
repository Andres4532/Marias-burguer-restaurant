import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { toNumber } from '../common/utils/decimal.util';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private mapProduct(product: {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    price: { toString(): string };
    imageUrl: string | null;
    isActive: boolean;
    sortOrder: number;
    trackStock: boolean;
    stockQuantity: number;
    createdAt: Date;
    updatedAt: Date;
    category?: { id: string; name: string };
    extras?: Array<{
      extra: {
        id: string;
        name: string;
        price: { toString(): string };
        isActive: boolean;
      };
    }>;
  }) {
    return {
      id: product.id,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      name: product.name,
      description: product.description,
      price: toNumber(product.price),
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      trackStock: product.trackStock,
      stockQuantity: product.stockQuantity,
      extras: product.extras?.map((pe) => ({
        id: pe.extra.id,
        name: pe.extra.name,
        price: toNumber(pe.extra.price),
        isActive: pe.extra.isActive,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async validateCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      throw new BadRequestException('Categoría no válida');
    }
    return category;
  }

  private async validateExtras(extraIds: string[]) {
    if (!extraIds.length) return;

    const extras = await this.prisma.extra.findMany({
      where: { id: { in: extraIds }, deletedAt: null },
    });

    if (extras.length !== extraIds.length) {
      throw new BadRequestException('Uno o más extras no son válidos');
    }
  }

  async findAll(
    categoryId?: string,
    includeInactive = false,
    trackStockOnly = false,
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
        ...(trackStockOnly ? { trackStock: true } : {}),
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        extras: {
          include: {
            extra: {
              select: { id: true, name: true, price: true, isActive: true },
            },
          },
        },
      },
    });

    return products.map((p) => this.mapProduct(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        extras: {
          include: {
            extra: {
              select: { id: true, name: true, price: true, isActive: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.mapProduct(product);
  }

  async create(dto: CreateProductDto) {
    await this.validateCategory(dto.categoryId);

    const existing = await this.prisma.product.findFirst({
      where: { name: dto.name, categoryId: dto.categoryId, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un producto con ese nombre en la categoría',
      );
    }

    const extraIds = dto.extraIds ?? [];
    await this.validateExtras(extraIds);

    const product = await this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl || null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        trackStock: dto.trackStock ?? false,
        stockQuantity: dto.trackStock ? (dto.stockQuantity ?? 0) : 0,
        extras: extraIds.length
          ? {
              create: extraIds.map((extraId) => ({ extraId })),
            }
          : undefined,
      },
    });

    return this.findOne(product.id);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      await this.validateCategory(dto.categoryId);
    }

    if (dto.name) {
      const categoryId =
        dto.categoryId ??
        (await this.prisma.product.findUnique({ where: { id } }))?.categoryId;

      const existing = await this.prisma.product.findFirst({
        where: {
          name: dto.name,
          categoryId,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe un producto con ese nombre en la categoría',
        );
      }
    }

    const { extraIds, ...rest } = dto;
    const productData = {
      ...rest,
      imageUrl:
        rest.imageUrl === '' ? null : rest.imageUrl,
    };

    if (dto.trackStock === false) {
      productData.stockQuantity = 0;
    }

    if (extraIds !== undefined) {
      await this.validateExtras(extraIds);

      await this.prisma.$transaction([
        this.prisma.productExtra.deleteMany({ where: { productId: id } }),
        ...(extraIds.length
          ? [
              this.prisma.productExtra.createMany({
                data: extraIds.map((extraId) => ({
                  productId: id,
                  extraId,
                })),
              }),
            ]
          : []),
        this.prisma.product.update({ where: { id }, data: productData }),
      ]);
    } else {
      await this.prisma.product.update({ where: { id }, data: productData });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Producto eliminado' };
  }
}
