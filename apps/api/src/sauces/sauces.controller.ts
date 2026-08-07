import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { SaucesService } from './sauces.service';
import { CreateSauceDto } from './dto/create-sauce.dto';
import { UpdateSauceDto } from './dto/update-sauce.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('sauces')
@UseGuards(AuthGuard('jwt'))
export class SaucesController {
  constructor(private saucesService: SaucesService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.saucesService.findAll(all === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saucesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  create(@Body() dto: CreateSauceDto) {
    return this.saucesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  update(@Param('id') id: string, @Body() dto: UpdateSauceDto) {
    return this.saucesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  remove(@Param('id') id: string) {
    return this.saucesService.remove(id);
  }
}
