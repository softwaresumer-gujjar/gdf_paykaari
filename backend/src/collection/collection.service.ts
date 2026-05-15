import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionEntryDto } from './dto/create-collection-entry.dto';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreateCollectionEntryDto) {
    return this.prisma.collectionEntry.create({
      data: { ...dto, date: new Date(dto.date), organizationId },
      include: { farmer: true },
    });
  }

  async findAll(organizationId: string, date?: string, page = 1, limit = 50) {
    const where: Record<string, unknown> = { organizationId };
    if (date) where.date = new Date(date);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.collectionEntry.findMany({
        where,
        include: { farmer: true, trip: true },
        orderBy: [{ date: 'desc' }, { session: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.collectionEntry.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDailySummary(organizationId: string, date: string) {
    const d = new Date(date);
    const [total, morning, evening] = await Promise.all([
      this.prisma.collectionEntry.aggregate({
        where: { organizationId, date: d },
        _sum: { collectedMaunds: true },
        _count: true,
      }),
      this.prisma.collectionEntry.aggregate({
        where: { organizationId, date: d, session: 'MORNING' },
        _sum: { collectedMaunds: true },
        _count: true,
      }),
      this.prisma.collectionEntry.aggregate({
        where: { organizationId, date: d, session: 'EVENING' },
        _sum: { collectedMaunds: true },
        _count: true,
      }),
    ]);
    return {
      total: { muns: Number(total._sum.collectedMaunds ?? 0), count: total._count },
      morning: { muns: Number(morning._sum.collectedMaunds ?? 0), count: morning._count },
      evening: { muns: Number(evening._sum.collectedMaunds ?? 0), count: evening._count },
    };
  }
}
