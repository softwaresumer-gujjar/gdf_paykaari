import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, AddStopDto } from './dto/create-trip.dto';
import { TripStatus } from '@prisma/client';

interface Stop {
  location: string;
  notes?: string;
  time: string;
}

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  createTrip(organizationId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: { ...dto, date: new Date(dto.date), organizationId, startTime: new Date() },
      include: { driver: { select: { id: true, name: true } } },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.trip.findMany({
      where: { organizationId },
      include: { driver: { select: { id: true, name: true } }, collectionEntries: { include: { farmer: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, organizationId },
      include: { driver: { select: { id: true, name: true } }, collectionEntries: { include: { farmer: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async addStop(organizationId: string, id: string, dto: AddStopDto) {
    const trip = await this.findOne(organizationId, id);
    const stops = (trip.stops as unknown as Stop[]) || [];
    stops.push({ ...dto, time: new Date().toISOString() });
    return this.prisma.trip.update({ where: { id }, data: { stops: stops as unknown as never } });
  }

  async completeTrip(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.trip.update({
      where: { id },
      data: { status: TripStatus.COMPLETED, endTime: new Date() },
    });
  }

  getTanks(organizationId: string) {
    return this.prisma.tank.findMany({ where: { organizationId }, orderBy: { tankNumber: 'asc' } });
  }

  createTank(organizationId: string, data: { tankNumber: string; capacityLiters?: number }) {
    return this.prisma.tank.create({ data: { ...data, organizationId } });
  }
}
