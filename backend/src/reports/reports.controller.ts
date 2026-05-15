import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('collection')
  getCollection(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('session') session?: string,
  ) {
    const from = dateFrom || new Date().toISOString().split('T')[0];
    const to = dateTo || from;
    return this.service.getCollectionReport(user.organizationId, from, to, session);
  }

  @Get('delivery')
  getDelivery(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('session') session?: string,
  ) {
    const from = dateFrom || new Date().toISOString().split('T')[0];
    const to = dateTo || from;
    return this.service.getDeliveryReport(user.organizationId, from, to, session);
  }

  @Get('balance')
  getBalance(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const from = dateFrom || new Date().toISOString().split('T')[0];
    const to = dateTo || from;
    return this.service.getBalanceReport(user.organizationId, from, to);
  }

  @Get('quality')
  getQuality(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('farmerId') farmerId?: string,
  ) {
    const from = dateFrom || new Date().toISOString().split('T')[0];
    const to = dateTo || from;
    return this.service.getQualityReport(user.organizationId, from, to, farmerId);
  }

  @Get('payments')
  getPayments(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const from = dateFrom || new Date().toISOString().split('T')[0];
    const to = dateTo || from;
    return this.service.getPaymentReport(user.organizationId, from, to);
  }

  @Get('receivables')
  getReceivables(@CurrentUser() user: { organizationId: string }) {
    return this.service.getReceivablesReport(user.organizationId);
  }
}
