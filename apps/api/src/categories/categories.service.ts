import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null } },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      productCount: c._count.products,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            products: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return {
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      productCount: category._count.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.findOne(category.id);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: { name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    return this.findOne(id);
  }

  async remove(id: string, removeProducts = false) {
    await this.findOne(id);

    const products = await this.prisma.product.findMany({
      where: { categoryId: id, deletedAt: null },
      select: { id: true },
    });

    if (products.length > 0 && !removeProducts) {
      throw new ConflictException(
        `Esta categoría tiene ${products.length} producto(s). Debes confirmar la eliminación de los productos.`,
      );
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (removeProducts && products.length > 0) {
        await tx.product.updateMany({
          where: { categoryId: id, deletedAt: null },
          data: { deletedAt: now, isActive: false },
        });
      }

      await tx.category.update({
        where: { id },
        data: { deletedAt: now, isActive: false },
      });
    });

    return {
      message: 'Categoría eliminada',
      removedProducts: removeProducts ? products.length : 0,
    };
  }
}
