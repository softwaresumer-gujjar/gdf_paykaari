import { PartialType } from '@nestjs/mapped-types';
import { CreateRetailerDto } from './create-retailer.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRetailerDto extends PartialType(CreateRetailerDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
