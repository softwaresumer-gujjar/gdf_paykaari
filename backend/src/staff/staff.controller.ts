import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private service: StaffService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateStaffDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Get('payroll')
  getPayrollSummary(@CurrentUser() user: { organizationId: string }) {
    return this.service.getPayrollSummary(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: Partial<CreateStaffDto>) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
