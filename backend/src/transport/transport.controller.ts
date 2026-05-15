import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { CreateTripDto, AddStopDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportController {
  constructor(private service: TransportService) {}

  @Post('trips')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DRIVER)
  createTrip(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateTripDto) {
    return this.service.createTrip(user.organizationId, dto);
  }

  @Get('trips')
  findAll(@CurrentUser() user: { organizationId: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Get('trips/:id')
  findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.findOne(user.organizationId, id);
  }

  @Post('trips/:id/stops')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DRIVER)
  addStop(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: AddStopDto) {
    return this.service.addStop(user.organizationId, id, dto);
  }

  @Patch('trips/:id/complete')
  @Roles(Role.ADMIN, Role.MANAGER, Role.DRIVER)
  completeTrip(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.completeTrip(user.organizationId, id);
  }

  @Get('tanks')
  getTanks(@CurrentUser() user: { organizationId: string }) {
    return this.service.getTanks(user.organizationId);
  }

  @Post('tanks')
  @Roles(Role.ADMIN, Role.MANAGER)
  createTank(
    @CurrentUser() user: { organizationId: string },
    @Body() body: { tankNumber: string; capacityLiters?: number },
  ) {
    return this.service.createTank(user.organizationId, body);
  }
}
