import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  @Get()
  getCurrent(@CurrentUser() user: { organizationId: string }) {
    return this.service.getCurrent(user.organizationId);
  }

  @Get('history')
  getHistory(@CurrentUser() user: { organizationId: string }) {
    return this.service.getHistory(user.organizationId);
  }
}
