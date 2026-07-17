import { IsDateString } from 'class-validator';

export class ReportRangeQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
