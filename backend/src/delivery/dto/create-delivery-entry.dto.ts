import { IsString, IsNumber, IsDateString, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RateSession } from '@prisma/client';

export class CreateDeliveryEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(RateSession)
  @IsOptional()
  session?: RateSession;

  @IsString()
  retailerId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  deliveredMaunds: number;
}
