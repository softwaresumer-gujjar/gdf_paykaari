import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFarmerDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  contractedMaunds: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedRatePerMaund: number;

  @IsDateString()
  @IsOptional()
  contractStart?: string;

  @IsDateString()
  @IsOptional()
  contractEnd?: string;
}
