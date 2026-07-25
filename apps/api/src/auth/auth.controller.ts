import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { InMemoryRateLimitService } from '../common/rate-limit/in-memory-rate-limit.service';
import { getClientIp } from '../common/utils/client-ip.util';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_IP = 15;
const LOGIN_MAX_PER_EMAIL = 10;

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rateLimit: InMemoryRateLimitService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = getClientIp(req);
    const emailKey = dto.email.trim().toLowerCase();

    this.rateLimit.assertWithinLimit(
      `login:ip:${ip}`,
      LOGIN_MAX_PER_IP,
      LOGIN_WINDOW_MS,
      'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.',
    );
    this.rateLimit.assertWithinLimit(
      `login:email:${emailKey}`,
      LOGIN_MAX_PER_EMAIL,
      LOGIN_WINDOW_MS,
      'Demasiados intentos de inicio de sesión. Intenta de nuevo en unos minutos.',
    );

    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.getProfile(user.id);
  }

  @Get('admin-check')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.JEFA)
  adminCheck() {
    return { message: 'Acceso de jefa confirmado' };
  }

  @Patch('password')
  @UseGuards(AuthGuard('jwt'))
  changePassword(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}
