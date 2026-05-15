import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionEntryDto } from './dto/create-collection-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('collection')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CollectionController {
  constructor(private service: CollectionService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.DRIVER)
  create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateCollectionEntryDto) {
    return this.service.create(user.organizationId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(user.organizationId, date, page ? +page : 1, limit ? +limit : 50);
  }

  @Get('summary')
  getDailySummary(@CurrentUser() user: { organizationId: string }, @Query('date') date: string) {
    return this.service.getDailySummary(user.organizationId, date || new Date().toISOString().split('T')[0]);
  }
}
