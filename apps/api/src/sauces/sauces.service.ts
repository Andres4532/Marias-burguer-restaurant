import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSauceDto } from './dto/create-sauce.dto';
import { UpdateSauceDto } from './dto/update-sauce.dto';

@Injectable()
export class SaucesService {
  constructor(private prisma: PrismaService) {}

  private mapSauce(sauce: {
    id: string;
    name: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: sauce.id,
      name: sauce.name,
      isActive: sauce.isActive,
      sortOrder: sauce.sortOrder,
      createdAt: sauce.createdAt,
      updatedAt: sauce.updatedAt,
    };
  }

  async findAll(includeInactive = false) {
    const sauces = await this.prisma.sauce.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return sauces.map((sauce) => this.mapSauce(sauce));
  }

  async findOne(id: string) {
    const sauce = await this.prisma.sauce.findFirst({
      where: { id, deletedAt: null },
    });

    if (!sauce) {
      throw new NotFoundException('Salsa no encontrada');
    }

    return this.mapSauce(sauce);
  }

  async create(dto: CreateSauceDto) {
    const existing = await this.prisma.sauce.findFirst({
      where: { name: dto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Ya existe una salsa con ese nombre');
    }

    const sauce = await this.prisma.sauce.create({
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapSauce(sauce);
  }

  async update(id: string, dto: UpdateSauceDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.sauce.findFirst({
        where: { name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe una salsa con ese nombre');
      }
    }

    const sauce = await this.prisma.sauce.update({
      where: { id },
      data: dto,
    });

    return this.mapSauce(sauce);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.sauce.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Salsa eliminada' };
  }
}
