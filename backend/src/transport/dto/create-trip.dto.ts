import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTripDto {
  @IsDateString()
  date: string;

  @IsString()
  driverId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddStopDto {
  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
