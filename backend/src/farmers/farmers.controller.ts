import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FarmersService } from './farmers.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private service: FarmersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateFarmerDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Get(':id/stats')
  getStats(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.getStats(user.organizationId, id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
