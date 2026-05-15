import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentDirection, PaymentMode } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post()
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() dto: CreatePaymentDto,
  ) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: { organizationId: string },
    @Query('direction') direction?: PaymentDirection,
    @Query('paymentType') paymentType?: PaymentMode,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('farmerId') farmerId?: string,
    @Query('retailerId') retailerId?: string,
  ) {
    return this.service.list(user.organizationId, direction, paymentType, dateFrom, dateTo, farmerId, retailerId);
  }

  @Get('summary')
  getSummary(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getSummary(user.organizationId, dateFrom, dateTo);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
  ) {
    return this.service.remove(user.organizationId, id);
  }
}
