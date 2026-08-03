import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { normalizeLoginIdentifier } from '../common/validators/login-identifier';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapUser(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return users.map((u) => this.mapUser(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.mapUser(user);
  }

  async create(dto: CreateUserDto) {
    const loginId = normalizeLoginIdentifier(dto.email);
    const existing = await this.prisma.user.findUnique({
      where: { email: loginId },
    });
    if (existing) {
      throw new ConflictException('Ese correo o usuario ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: loginId,
        passwordHash,
        name: dto.name.trim(),
        role: dto.role,
      },
    });

    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email) {
      const loginId = normalizeLoginIdentifier(dto.email);
      if (loginId !== user.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: loginId },
        });
        if (existing) {
          throw new ConflictException('Ese correo o usuario ya está registrado');
        }
      }
    }

    if (dto.isActive === false && id === actorId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    if (dto.role === UserRole.CAJERA && user.role === UserRole.JEFA) {
      await this.ensureAnotherActiveJefa(id);
    }

    if (dto.isActive === false && user.role === UserRole.JEFA) {
      await this.ensureAnotherActiveJefa(id);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ? normalizeLoginIdentifier(dto.email) : undefined,
        name: dto.name?.trim(),
        role: dto.role,
        isActive: dto.isActive,
      },
    });

    return this.mapUser(updated);
  }

  async resetPassword(id: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const passwordHash = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: 'Contraseña actualizada' };
  }

  private async ensureAnotherActiveJefa(excludeId: string) {
    const count = await this.prisma.user.count({
      where: {
        role: UserRole.JEFA,
        isActive: true,
        id: { not: excludeId },
      },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Debe haber al menos una jefa activa en el sistema',
      );
    }
  }
}
