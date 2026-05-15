import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private service: AccountsService) {}

  @Get('profit-loss')
  getProfitLoss(
    @CurrentUser() user: { organizationId: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    const now = new Date();
    const from = dateFrom || `${now.getFullYear()}-01-01`;
    const to = dateTo || now.toISOString().split('T')[0];
    return this.service.getProfitLoss(user.organizationId, from, to);
  }

  @Get('balance-sheet')
  getBalanceSheet(@CurrentUser() user: { organizationId: string }) {
    return this.service.getBalanceSheet(user.organizationId);
  }
}
