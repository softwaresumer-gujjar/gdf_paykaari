import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RetailersService } from './retailers.service';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('retailers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RetailersController {
  constructor(private service: RetailersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateRetailerDto) {
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

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: UpdateRetailerDto) {
    return this.service.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.remove(user.organizationId, id);
  }
}
