import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryEntryDto } from './dto/create-delivery-entry.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreateDeliveryEntryDto) {
    return this.prisma.deliveryEntry.create({
      data: { ...dto, date: new Date(dto.date), organizationId },
      include: { retailer: true },
    });
  }

  async findAll(organizationId: string, date?: string, page = 1, limit = 50) {
    const where: Record<string, unknown> = { organizationId };
    if (date) where.date = new Date(date);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.deliveryEntry.findMany({
        where,
        include: { retailer: true },
        orderBy: [{ date: 'desc' }, { session: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.deliveryEntry.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDailySummary(organizationId: string, date: string) {
    const d = new Date(date);
    const [total, morning, evening] = await Promise.all([
      this.prisma.deliveryEntry.aggregate({
        where: { organizationId, date: d },
        _sum: { deliveredMaunds: true },
        _count: true,
      }),
      this.prisma.deliveryEntry.aggregate({
        where: { organizationId, date: d, session: 'MORNING' },
        _sum: { deliveredMaunds: true },
        _count: true,
      }),
      this.prisma.deliveryEntry.aggregate({
        where: { organizationId, date: d, session: 'EVENING' },
        _sum: { deliveredMaunds: true },
        _count: true,
      }),
    ]);
    return {
      total: { muns: Number(total._sum.deliveredMaunds ?? 0), count: total._count },
      morning: { muns: Number(morning._sum.deliveredMaunds ?? 0), count: morning._count },
      evening: { muns: Number(evening._sum.deliveredMaunds ?? 0), count: evening._count },
    };
  }
}
