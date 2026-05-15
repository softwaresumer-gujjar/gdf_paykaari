import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SchedulerController {
  constructor(private service: SchedulerService) {}

  @Get()
  list(@CurrentUser() user: { organizationId: string }) {
    return this.service.list(user.organizationId);
  }

  @Get(':id')
  get(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.get(user.organizationId, id);
  }

  @Post()
  create(@CurrentUser() user: { organizationId: string }, @Body() body: Parameters<SchedulerService['create']>[1]) {
    return this.service.create(user.organizationId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() body: Parameters<SchedulerService['update']>[2],
  ) {
    return this.service.update(user.organizationId, id, body);
  }

  @Patch(':id/toggle')
  toggle(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.service.toggle(user.organizationId, id, body.isActive);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.delete(user.organizationId, id);
  }
}
