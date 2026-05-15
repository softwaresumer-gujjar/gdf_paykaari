import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentDirection, PaymentMode } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        organizationId,
        date: new Date(dto.date),
        amount: dto.amount,
        paymentType: dto.paymentType,
        direction: dto.direction,
        farmerId: dto.farmerId,
        retailerId: dto.retailerId,
        reference: dto.reference,
        notes: dto.notes,
      },
      include: { farmer: true, retailer: true },
    });
  }

  list(
    organizationId: string,
    direction?: PaymentDirection,
    paymentType?: PaymentMode,
    dateFrom?: string,
    dateTo?: string,
    farmerId?: string,
    retailerId?: string,
  ) {
    const where: Record<string, unknown> = { organizationId };
    if (direction) where.direction = direction;
    if (paymentType) where.paymentType = paymentType;
    if (farmerId) where.farmerId = farmerId;
    if (retailerId) where.retailerId = retailerId;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }
    return this.prisma.payment.findMany({
      where,
      include: { farmer: true, retailer: true },
      orderBy: { date: 'desc' },
    });
  }

  remove(organizationId: string, id: string) {
    return this.prisma.payment.delete({ where: { id, organizationId } });
  }

  async getSummary(organizationId: string, dateFrom?: string, dateTo?: string) {
    const where: Record<string, unknown> = { organizationId };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }

    const [incoming, outgoing, byType] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...where, direction: 'INCOMING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: { ...where, direction: 'OUTGOING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['paymentType'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      incoming: { amount: Number(incoming._sum.amount ?? 0), count: incoming._count },
      outgoing: { amount: Number(outgoing._sum.amount ?? 0), count: outgoing._count },
      net: Number(incoming._sum.amount ?? 0) - Number(outgoing._sum.amount ?? 0),
      byType: byType.map((b) => ({
        type: b.paymentType,
        amount: Number(b._sum.amount ?? 0),
        count: b._count,
      })),
    };
  }
}
