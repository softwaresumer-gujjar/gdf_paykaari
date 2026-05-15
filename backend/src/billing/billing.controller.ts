import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { GenerateInvoicesDto } from './dto/generate-invoice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, PaymentMode } from '@prisma/client';

class MarkPaidDto {
  paymentMode?: PaymentMode;
  paymentReference?: string;
}

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private service: BillingService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: { organizationId: string }) {
    return this.service.getDashboardSummary(user.organizationId);
  }

  @Post('generate/farmers')
  @Roles(Role.ADMIN, Role.MANAGER)
  generateFarmerInvoices(@CurrentUser() user: { organizationId: string }, @Body() dto: GenerateInvoicesDto) {
    return this.service.generateFarmerInvoices(user.organizationId, dto.date);
  }

  @Post('generate/retailers')
  @Roles(Role.ADMIN, Role.MANAGER)
  generateRetailerInvoices(@CurrentUser() user: { organizationId: string }, @Body() dto: GenerateInvoicesDto) {
    return this.service.generateRetailerInvoices(user.organizationId, dto.date);
  }

  @Get('farmers')
  getFarmerInvoices(
    @CurrentUser() user: { organizationId: string },
    @Query('farmerId') farmerId?: string,
    @Query('isPaid') isPaid?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('paymentMode') paymentMode?: PaymentMode,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const paid = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
    return this.service.getFarmerInvoices(user.organizationId, farmerId, paid, dateFrom, dateTo, paymentMode, page ? +page : 1, limit ? +limit : 50);
  }

  @Get('retailers')
  getRetailerInvoices(
    @CurrentUser() user: { organizationId: string },
    @Query('retailerId') retailerId?: string,
    @Query('isPaid') isPaid?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('paymentMode') paymentMode?: PaymentMode,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const paid = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
    return this.service.getRetailerInvoices(user.organizationId, retailerId, paid, dateFrom, dateTo, paymentMode, page ? +page : 1, limit ? +limit : 50);
  }

  @Patch('farmers/:id/paid')
  @Roles(Role.ADMIN, Role.MANAGER)
  markFarmerPaid(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.service.markFarmerInvoicePaid(user.organizationId, id, dto.paymentMode, dto.paymentReference);
  }

  @Patch('retailers/:id/paid')
  @Roles(Role.ADMIN, Role.MANAGER)
  markRetailerPaid(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.service.markRetailerInvoicePaid(user.organizationId, id, dto.paymentMode, dto.paymentReference);
  }
}
