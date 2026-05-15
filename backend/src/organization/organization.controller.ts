import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('organization')
export class OrganizationController {
  constructor(private service: OrganizationService) {}

  @Get('public-branding')
  getPublicBranding() {
    return this.service.getPublicBranding();
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getSettings(@CurrentUser() user: { organizationId: string }) {
    return this.service.getSettings(user.organizationId);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateSettings(
    @CurrentUser() user: { organizationId: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateSettings(user.organizationId, body);
  }
}
