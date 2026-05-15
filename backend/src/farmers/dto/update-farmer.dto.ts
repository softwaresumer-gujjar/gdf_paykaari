import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmerDto } from './create-farmer.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFarmerDto extends PartialType(CreateFarmerDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
