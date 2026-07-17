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
import { ExtrasService } from './extras.service';
import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('extras')
@UseGuards(AuthGuard('jwt'))
export class ExtrasController {
  constructor(private extrasService: ExtrasService) {}

  @Get()
  findAll(@Query('all') all?: string) {
    return this.extrasService.findAll(all === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extrasService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  create(@Body() dto: CreateExtraDto) {
    return this.extrasService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  update(@Param('id') id: string, @Body() dto: UpdateExtraDto) {
    return this.extrasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.JEFA)
  remove(@Param('id') id: string) {
    return this.extrasService.remove(id);
  }
}
