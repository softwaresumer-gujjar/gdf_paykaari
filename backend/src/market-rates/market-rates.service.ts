import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketRateDto } from './dto/create-market-rate.dto';
import { RateSession } from '@prisma/client';

@Injectable()
export class MarketRatesService {
  constructor(private prisma: PrismaService) {}

  async upsert(organizationId: string, dto: CreateMarketRateDto) {
    return this.prisma.marketRate.upsert({
      where: {
        date_session_organizationId: {
          date: new Date(dto.date),
          session: dto.session,
          organizationId,
        },
      },
      create: { ...dto, date: new Date(dto.date), organizationId },
      update: { ratePerMaund: dto.ratePerMaund },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.marketRate.findMany({
      where: { organizationId },
      orderBy: [{ date: 'desc' }, { session: 'asc' }],
      take: 60,
    });
  }

  async getLatest(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rates = await this.prisma.marketRate.findMany({
      where: { organizationId, date: today },
    });
    const morning = rates.find((r) => r.session === RateSession.MORNING);
    const evening = rates.find((r) => r.session === RateSession.EVENING);
    return { morning: morning?.ratePerMaund ?? null, evening: evening?.ratePerMaund ?? null };
  }

  async getRateForDate(organizationId: string, date: Date): Promise<number> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const rates = await this.prisma.marketRate.findMany({ where: { organizationId, date: d } });
    if (!rates.length) {
      const latest = await this.prisma.marketRate.findFirst({
        where: { organizationId },
        orderBy: { date: 'desc' },
      });
      return latest ? Number(latest.ratePerMaund) : 0;
    }
    const evening = rates.find((r) => r.session === RateSession.EVENING);
    const morning = rates.find((r) => r.session === RateSession.MORNING);
    return Number((evening || morning)!.ratePerMaund);
  }
}
