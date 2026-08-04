import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductPromoType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { toNumber } from '../common/utils/decimal.util';
import { mapProductPromoFields } from '../common/utils/product-pricing.util';

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
    promoType: ProductPromoType;
    promoValue: { toString(): string } | null;
    promoStartsAt: Date | null;
    promoEndsAt: Date | null;
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
    const promo = mapProductPromoFields(product);

    return {
      id: product.id,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      name: product.name,
      description: product.description,
      price: promo.price,
      effectivePrice: promo.effectivePrice,
      hasPromotion: promo.hasPromotion,
      promoType: promo.promoType,
      promoValue: promo.promoValue,
      promoStartsAt: promo.promoStartsAt,
      promoEndsAt: promo.promoEndsAt,
      promoLabel: promo.promoLabel,
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

  private validatePromo(
    price: number,
    promoType?: ProductPromoType,
    promoValue?: number,
    promoStartsAt?: string | null,
    promoEndsAt?: string | null,
  ) {
    const type = promoType ?? ProductPromoType.NONE;

    if (type === ProductPromoType.NONE) {
      return {
        promoType: ProductPromoType.NONE,
        promoValue: null,
        promoStartsAt: null,
        promoEndsAt: null,
      };
    }

    if (promoValue == null) {
      throw new BadRequestException(
        'Debes indicar el valor de la promoción',
      );
    }

    if (type === ProductPromoType.PERCENT) {
      if (promoValue <= 0 || promoValue > 100) {
        throw new BadRequestException(
          'El descuento debe estar entre 1 y 100%',
        );
      }
    }

    if (type === ProductPromoType.FIXED_PRICE) {
      if (promoValue < 0) {
        throw new BadRequestException('El precio promocional no puede ser negativo');
      }
      if (promoValue >= price) {
        throw new BadRequestException(
          'El precio promocional debe ser menor al precio normal',
        );
      }
    }

    const startsAt =
      promoStartsAt === undefined
        ? null
        : promoStartsAt
          ? new Date(promoStartsAt)
          : null;
    const endsAt =
      promoEndsAt === undefined
        ? null
        : promoEndsAt
          ? new Date(promoEndsAt)
          : null;

    if (startsAt && endsAt && startsAt > endsAt) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la de fin',
      );
    }

    return {
      promoType: type,
      promoValue,
      promoStartsAt: startsAt,
      promoEndsAt: endsAt,
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

    const promo = this.validatePromo(
      dto.price,
      dto.promoType,
      dto.promoValue,
      dto.promoStartsAt,
      dto.promoEndsAt,
    );

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
        promoType: promo.promoType,
        promoValue: promo.promoValue,
        promoStartsAt: promo.promoStartsAt,
        promoEndsAt: promo.promoEndsAt,
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
    const current = await this.findOne(id);

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

    const { extraIds, promoType, promoValue, promoStartsAt, promoEndsAt, ...rest } =
      dto;

    const nextPrice = dto.price ?? current.price;
    const resolvedPromoType =
      promoType !== undefined ? promoType : current.promoType;
    const resolvedPromoValue =
      promoValue !== undefined
        ? promoValue
        : resolvedPromoType === ProductPromoType.NONE
          ? undefined
          : (current.promoValue ?? undefined);
    const resolvedStartsAt =
      promoStartsAt !== undefined
        ? promoStartsAt
        : current.promoStartsAt
          ? current.promoStartsAt.toISOString()
          : null;
    const resolvedEndsAt =
      promoEndsAt !== undefined
        ? promoEndsAt
        : current.promoEndsAt
          ? current.promoEndsAt.toISOString()
          : null;

    const promo = this.validatePromo(
      nextPrice,
      resolvedPromoType,
      resolvedPromoValue,
      resolvedStartsAt,
      resolvedEndsAt,
    );

    const productData = {
      ...rest,
      imageUrl: rest.imageUrl === '' ? null : rest.imageUrl,
      promoType: promo.promoType,
      promoValue: promo.promoValue,
      promoStartsAt: promo.promoStartsAt,
      promoEndsAt: promo.promoEndsAt,
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
