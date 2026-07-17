import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
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
