import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RateSession } from '@prisma/client';

export class CreateCollectionEntryDto {
  @IsDateString()
  date: string;

  @IsEnum(RateSession)
  @IsOptional()
  session?: RateSession;

  @IsString()
  farmerId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  collectedMaunds: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  qualityFatPercent?: number;

  @IsBoolean()
  @IsOptional()
  qualityWaterAdded?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  qualityDensity?: number;

  @IsBoolean()
  @IsOptional()
  qualityPassed?: boolean;

  @IsString()
  @IsOptional()
  qualityNotes?: string;

  @IsString()
  @IsOptional()
  tripId?: string;
}
