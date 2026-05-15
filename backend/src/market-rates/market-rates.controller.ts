import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MarketRatesService } from './market-rates.service';
import { CreateMarketRateDto } from './dto/create-market-rate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('market-rates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketRatesController {
  constructor(private service: MarketRatesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  upsert(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateMarketRateDto) {
    return this.service.upsert(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Get('latest')
  getLatest(@CurrentUser() user: { organizationId: string }) {
    return this.service.getLatest(user.organizationId);
  }
}
