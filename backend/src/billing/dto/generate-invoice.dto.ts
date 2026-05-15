import { IsDateString } from 'class-validator';

export class GenerateInvoicesDto {
  @IsDateString()
  date: string;
}
