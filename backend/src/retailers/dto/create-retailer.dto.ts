import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRetailerDto {
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
  committedMaunds: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedRatePerMaund: number;
}
