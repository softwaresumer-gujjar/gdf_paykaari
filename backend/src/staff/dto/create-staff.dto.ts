import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsEmail, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StaffRole } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(15)
  @IsOptional()
  nic?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salary: number;

  @IsDateString()
  @IsOptional()
  joinDate?: string;
}
