import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportRangeQueryDto } from './dto/report-range-query.dto';
import { ReportYearQueryDto } from './dto/report-year-query.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.JEFA)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  getDailyReport() {
    return this.reportsService.getDailyReport();
  }

  @Get('range')
  getRangeReport(@Query() query: ReportRangeQueryDto) {
    return this.reportsService.getRangeReport(query.from, query.to);
  }

  @Get('year')
  getYearReport(@Query() query: ReportYearQueryDto) {
    return this.reportsService.getYearReport(query.year);
  }
}