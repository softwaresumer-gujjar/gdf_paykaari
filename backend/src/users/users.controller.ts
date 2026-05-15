import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Post('invite')
  invite(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { name: string; email: string; role?: Role },
  ) {
    return this.service.invite(user.organizationId, body);
  }

  @Patch(':id/role')
  updateRole(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() body: { role: Role },
  ) {
    return this.service.updateRole(user.organizationId, id, body.role);
  }

  @Patch(':id/block')
  block(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.setBlocked(user.organizationId, id, true);
  }

  @Patch(':id/unblock')
  unblock(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.setBlocked(user.organizationId, id, false);
  }

  @Post(':id/reset-password')
  resetPassword(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.resetPassword(user.organizationId, id);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body() body: { allowedPages: string[] },
  ) {
    return this.service.updatePermissions(user.organizationId, id, body.allowedPages);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { organizationId: string; id: string },
    @Param('id') id: string,
  ) {
    return this.service.remove(user.organizationId, id, user.id);
  }
}
