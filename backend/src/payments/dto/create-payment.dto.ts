import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';
import { PaymentDirection, PaymentMode } from '@prisma/client';

export class CreatePaymentDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMode)
  paymentType: PaymentMode;

  @IsEnum(PaymentDirection)
  direction: PaymentDirection;

  @IsOptional()
  @IsString()
  farmerId?: string;

  @IsOptional()
  @IsString()
  retailerId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
