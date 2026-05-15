import { IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RateSession } from '@prisma/client';

export class CreateMarketRateDto {
  @IsDateString()
  date: string;

  @IsEnum(RateSession)
  session: RateSession;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ratePerMaund: number;
}
