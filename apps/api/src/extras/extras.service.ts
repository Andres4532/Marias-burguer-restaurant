import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';
import { toNumber } from '../common/utils/decimal.util';

@Injectable()
export class ExtrasService {
  constructor(private prisma: PrismaService) {}

  private mapExtra(extra: {
    id: string;
    name: string;
    price: { toString(): string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: extra.id,
      name: extra.name,
      price: toNumber(extra.price),
      isActive: extra.isActive,
      createdAt: extra.createdAt,
      updatedAt: extra.updatedAt,
    };
  }

  async findAll(includeInactive = false) {
    const extras = await this.prisma.extra.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    return extras.map((e) => this.mapExtra(e));
  }

  async findOne(id: string) {
    const extra = await this.prisma.extra.findFirst({
      where: { id, deletedAt: null },
    });

    if (!extra) {
      throw new NotFoundException('Extra no encontrado');
    }

    return this.mapExtra(extra);
  }

  async create(dto: CreateExtraDto) {
    const existing = await this.prisma.extra.findFirst({
      where: { name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Ya existe un extra con ese nombre');
    }

    const extra = await this.prisma.extra.create({
      data: {
        name: dto.name,
        price: dto.price,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapExtra(extra);
  }

  async update(id: string, dto: UpdateExtraDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.extra.findFirst({
        where: { name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe un extra con ese nombre');
      }
    }

    const extra = await this.prisma.extra.update({
      where: { id },
      data: dto,
    });

    return this.mapExtra(extra);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.extra.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Extra eliminado' };
  }
}
