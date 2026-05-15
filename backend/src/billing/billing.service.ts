import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketRatesService } from '../market-rates/market-rates.service';
import { PaymentMode } from '@prisma/client';

const TRANSPORT_SURCHARGE = 300;

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private marketRates: MarketRatesService,
  ) {}

  async generateFarmerInvoices(organizationId: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const marketRate = await this.marketRates.getRateForDate(organizationId, date);
    const farmers = await this.prisma.farmer.findMany({ where: { organizationId, isActive: true } });
    const results: unknown[] = [];

    for (const farmer of farmers) {
      const entries = await this.prisma.collectionEntry.findMany({
        where: { farmerId: farmer.id, organizationId, date },
      });

      const suppliedMaunds = entries.reduce((s, e) => s + Number(e.collectedMaunds), 0);
      const contractedMaunds = Number(farmer.contractedMaunds);
      const fixedRate = Number(farmer.fixedRatePerMaund);

      let baseAmount = 0;
      let shortfallPenalty = 0;
      let excessBonus = 0;

      if (suppliedMaunds <= contractedMaunds) {
        baseAmount = suppliedMaunds * fixedRate;
        const shortfall = contractedMaunds - suppliedMaunds;
        shortfallPenalty = shortfall * marketRate;
      } else {
        baseAmount = contractedMaunds * fixedRate;
        const excess = suppliedMaunds - contractedMaunds;
        excessBonus = excess * marketRate;
      }

      const netAmount = baseAmount - shortfallPenalty + excessBonus;

      await this.prisma.farmerInvoice.deleteMany({
        where: { farmerId: farmer.id, organizationId, date },
      });

      const invoice = await this.prisma.farmerInvoice.create({
        data: {
          farmerId: farmer.id,
          organizationId,
          date,
          contractedMaunds,
          suppliedMaunds,
          fixedRate,
          marketRate,
          baseAmount,
          shortfallPenalty,
          excessBonus,
          netAmount,
        },
      });

      results.push(invoice);
    }

    return results;
  }

  async generateRetailerInvoices(organizationId: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const marketRate = await this.marketRates.getRateForDate(organizationId, date);
    const retailers = await this.prisma.retailer.findMany({ where: { organizationId, isActive: true } });
    const results: unknown[] = [];

    for (const retailer of retailers) {
      const entries = await this.prisma.deliveryEntry.findMany({
        where: { retailerId: retailer.id, organizationId, date },
      });

      const purchasedMaunds = entries.reduce((s, e) => s + Number(e.deliveredMaunds), 0);
      const committedMaunds = Number(retailer.committedMaunds);
      const fixedRate = Number(retailer.fixedRatePerMaund);

      let baseAmount = 0;
      let excessSurcharge = 0;

      if (purchasedMaunds <= committedMaunds) {
        baseAmount = purchasedMaunds * fixedRate;
      } else {
        baseAmount = committedMaunds * fixedRate;
        const excess = purchasedMaunds - committedMaunds;
        excessSurcharge = excess * (marketRate + TRANSPORT_SURCHARGE);
      }

      const netAmount = baseAmount + excessSurcharge;

      await this.prisma.retailerInvoice.deleteMany({
        where: { retailerId: retailer.id, organizationId, date },
      });

      const invoice = await this.prisma.retailerInvoice.create({
        data: {
          retailerId: retailer.id,
          organizationId,
          date,
          committedMaunds,
          purchasedMaunds,
          fixedRate,
          marketRate,
          baseAmount,
          excessSurcharge,
          netAmount,
        },
      });

      results.push(invoice);
    }

    return results;
  }

  async getFarmerInvoices(
    organizationId: string,
    farmerId?: string,
    isPaid?: boolean,
    dateFrom?: string,
    dateTo?: string,
    paymentMode?: PaymentMode,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = { organizationId };
    if (farmerId) where.farmerId = farmerId;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (paymentMode) where.paymentMode = paymentMode;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.farmerInvoice.findMany({
        where,
        include: { farmer: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.farmerInvoice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRetailerInvoices(
    organizationId: string,
    retailerId?: string,
    isPaid?: boolean,
    dateFrom?: string,
    dateTo?: string,
    paymentMode?: PaymentMode,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = { organizationId };
    if (retailerId) where.retailerId = retailerId;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (paymentMode) where.paymentMode = paymentMode;
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.date = dateFilter;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.retailerInvoice.findMany({
        where,
        include: { retailer: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.retailerInvoice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  markFarmerInvoicePaid(
    _organizationId: string,
    id: string,
    paymentMode?: PaymentMode,
    paymentReference?: string,
  ) {
    return this.prisma.farmerInvoice.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date(), paymentMode, paymentReference },
    });
  }

  markRetailerInvoicePaid(
    _organizationId: string,
    id: string,
    paymentMode?: PaymentMode,
    paymentReference?: string,
  ) {
    return this.prisma.retailerInvoice.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date(), paymentMode, paymentReference },
    });
  }

  async getDashboardSummary(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build last 7 days array
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const [collectionAgg, deliveryAgg, farmers, retailers, marketRate, unpaidRetailer, unpaidFarmer] = await Promise.all([
      this.prisma.collectionEntry.aggregate({
        where: { organizationId, date: today },
        _sum: { collectedMaunds: true },
      }),
      this.prisma.deliveryEntry.aggregate({
        where: { organizationId, date: today },
        _sum: { deliveredMaunds: true },
      }),
      this.prisma.farmer.aggregate({
        where: { organizationId, isActive: true },
        _sum: { contractedMaunds: true },
        _count: true,
      }),
      this.prisma.retailer.aggregate({
        where: { organizationId, isActive: true },
        _sum: { committedMaunds: true },
        _count: true,
      }),
      this.marketRates.getLatest(organizationId),
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId, isPaid: false },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId, isPaid: false },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    // Fetch 7-day trend data in parallel
    const trendData = await Promise.all(
      days.map(async (d) => {
        const [col, del] = await Promise.all([
          this.prisma.collectionEntry.aggregate({
            where: { organizationId, date: d },
            _sum: { collectedMaunds: true },
          }),
          this.prisma.deliveryEntry.aggregate({
            where: { organizationId, date: d },
            _sum: { deliveredMaunds: true },
          }),
        ]);
        return {
          date: d.toISOString().split('T')[0],
          collected: Number(col._sum.collectedMaunds ?? 0),
          delivered: Number(del._sum.deliveredMaunds ?? 0),
        };
      }),
    );

    return {
      today: today.toISOString().split('T')[0],
      collection: {
        collected: Number(collectionAgg._sum.collectedMaunds ?? 0),
        contracted: Number(farmers._sum.contractedMaunds ?? 0),
        farmerCount: farmers._count,
      },
      delivery: {
        delivered: Number(deliveryAgg._sum.deliveredMaunds ?? 0),
        committed: Number(retailers._sum.committedMaunds ?? 0),
        retailerCount: retailers._count,
      },
      marketRate,
      financials: {
        totalReceivables: Number(unpaidRetailer._sum.netAmount ?? 0),
        receivableCount: unpaidRetailer._count,
        totalPayables: Number(unpaidFarmer._sum.netAmount ?? 0),
        payableCount: unpaidFarmer._count,
        netPosition:
          Number(unpaidRetailer._sum.netAmount ?? 0) - Number(unpaidFarmer._sum.netAmount ?? 0),
      },
      trend: trendData,
    };
  }
}
