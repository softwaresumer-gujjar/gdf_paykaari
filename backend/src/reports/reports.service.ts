import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCollectionReport(organizationId: string, dateFrom: string, dateTo: string, session?: string) {
    const where: Record<string, unknown> = {
      organizationId,
      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    };
    if (session) where.session = session;

    const entries = await this.prisma.collectionEntry.findMany({
      where,
      include: { farmer: true },
      orderBy: [{ date: 'asc' }, { session: 'asc' }],
    });

    const totals = await this.prisma.collectionEntry.aggregate({
      where,
      _sum: { collectedMaunds: true },
      _count: true,
    });

    return {
      entries,
      summary: {
        totalMuns: Number(totals._sum.collectedMaunds ?? 0),
        totalEntries: totals._count,
      },
    };
  }

  async getDeliveryReport(organizationId: string, dateFrom: string, dateTo: string, session?: string) {
    const where: Record<string, unknown> = {
      organizationId,
      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    };
    if (session) where.session = session;

    const entries = await this.prisma.deliveryEntry.findMany({
      where,
      include: { retailer: true },
      orderBy: [{ date: 'asc' }, { session: 'asc' }],
    });

    const totals = await this.prisma.deliveryEntry.aggregate({
      where,
      _sum: { deliveredMaunds: true },
      _count: true,
    });

    return {
      entries,
      summary: {
        totalMuns: Number(totals._sum.deliveredMaunds ?? 0),
        totalEntries: totals._count,
      },
    };
  }

  async getBalanceReport(organizationId: string, dateFrom: string, dateTo: string) {
    const dateFilter = { gte: new Date(dateFrom), lte: new Date(dateTo) };

    const [collected, delivered, farmerPayables, retailerReceivables] = await Promise.all([
      this.prisma.collectionEntry.aggregate({
        where: { organizationId, date: dateFilter },
        _sum: { collectedMaunds: true },
      }),
      this.prisma.deliveryEntry.aggregate({
        where: { organizationId, date: dateFilter },
        _sum: { deliveredMaunds: true },
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId, date: dateFilter, isPaid: false },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId, date: dateFilter, isPaid: false },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    return {
      collection: { totalMuns: Number(collected._sum.collectedMaunds ?? 0) },
      delivery: { totalMuns: Number(delivered._sum.deliveredMaunds ?? 0) },
      balance: { muns: Number(collected._sum.collectedMaunds ?? 0) - Number(delivered._sum.deliveredMaunds ?? 0) },
      payables: {
        amount: Number(farmerPayables._sum.netAmount ?? 0),
        count: farmerPayables._count,
      },
      receivables: {
        amount: Number(retailerReceivables._sum.netAmount ?? 0),
        count: retailerReceivables._count,
      },
    };
  }

  async getQualityReport(
    organizationId: string,
    dateFrom: string,
    dateTo: string,
    farmerId?: string,
  ) {
    const where: Record<string, unknown> = {
      organizationId,
      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
    };
    if (farmerId) where.farmerId = farmerId;

    const entries = await this.prisma.collectionEntry.findMany({
      where,
      include: { farmer: true },
      orderBy: [{ date: 'asc' }, { farmer: { name: 'asc' } }],
    });

    const passed = entries.filter((e) => e.qualityPassed).length;
    const failed = entries.length - passed;
    const avgFat =
      entries.filter((e) => e.qualityFatPercent != null).length > 0
        ? entries
            .filter((e) => e.qualityFatPercent != null)
            .reduce((s, e) => s + Number(e.qualityFatPercent), 0) /
          entries.filter((e) => e.qualityFatPercent != null).length
        : null;

    // Per-farmer summary
    const farmerMap = new Map<string, { name: string; total: number; passed: number; totalFat: number; fatCount: number; waterAdded: number }>();
    for (const e of entries) {
      const key = e.farmerId;
      if (!farmerMap.has(key)) {
        farmerMap.set(key, { name: e.farmer.name, total: 0, passed: 0, totalFat: 0, fatCount: 0, waterAdded: 0 });
      }
      const f = farmerMap.get(key)!;
      f.total++;
      if (e.qualityPassed) f.passed++;
      if (e.qualityFatPercent != null) { f.totalFat += Number(e.qualityFatPercent); f.fatCount++; }
      if (e.qualityWaterAdded) f.waterAdded++;
    }

    const byFarmer = Array.from(farmerMap.entries()).map(([id, v]) => ({
      farmerId: id,
      name: v.name,
      total: v.total,
      passed: v.passed,
      failed: v.total - v.passed,
      passRate: v.total > 0 ? Math.round((v.passed / v.total) * 100) : 0,
      avgFat: v.fatCount > 0 ? Math.round((v.totalFat / v.fatCount) * 10) / 10 : null,
      waterAdded: v.waterAdded,
    }));

    return {
      entries: entries.map((e) => ({
        id: e.id,
        date: e.date,
        session: e.session,
        farmer: { name: e.farmer.name },
        collectedMaunds: Number(e.collectedMaunds),
        qualityPassed: e.qualityPassed,
        qualityFatPercent: e.qualityFatPercent != null ? Number(e.qualityFatPercent) : null,
        qualityWaterAdded: e.qualityWaterAdded,
        qualityDensity: e.qualityDensity != null ? Number(e.qualityDensity) : null,
        qualityNotes: e.qualityNotes,
      })),
      summary: {
        total: entries.length,
        passed,
        failed,
        passRate: entries.length > 0 ? Math.round((passed / entries.length) * 100) : 0,
        avgFat: avgFat != null ? Math.round(avgFat * 10) / 10 : null,
        waterAdded: entries.filter((e) => e.qualityWaterAdded).length,
      },
      byFarmer,
    };
  }

  async getPaymentReport(organizationId: string, dateFrom: string, dateTo: string) {
    const dateFilter = { gte: new Date(dateFrom), lte: new Date(dateTo) };

    const [paidFarmer, paidRetailer, payments] = await Promise.all([
      this.prisma.farmerInvoice.findMany({
        where: { organizationId, isPaid: true, paidAt: dateFilter },
        include: { farmer: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.retailerInvoice.findMany({
        where: { organizationId, isPaid: true, paidAt: dateFilter },
        include: { retailer: true },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { organizationId, date: dateFilter },
        include: { farmer: true, retailer: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    const totalFarmerPaid = paidFarmer.reduce((s, i) => s + Number(i.netAmount), 0);
    const totalRetailerCollected = paidRetailer.reduce((s, i) => s + Number(i.netAmount), 0);
    const totalManualIn = payments.filter((p) => p.direction === 'INCOMING').reduce((s, p) => s + Number(p.amount), 0);
    const totalManualOut = payments.filter((p) => p.direction === 'OUTGOING').reduce((s, p) => s + Number(p.amount), 0);

    return {
      farmerPayments: paidFarmer.map((i) => ({
        id: i.id,
        date: i.paidAt,
        party: i.farmer.name,
        amount: Number(i.netAmount),
        paymentMode: i.paymentMode,
        reference: i.paymentReference,
        type: 'OUTGOING',
        source: 'FARMER_INVOICE',
      })),
      retailerPayments: paidRetailer.map((i) => ({
        id: i.id,
        date: i.paidAt,
        party: i.retailer.name,
        amount: Number(i.netAmount),
        paymentMode: i.paymentMode,
        reference: i.paymentReference,
        type: 'INCOMING',
        source: 'RETAILER_INVOICE',
      })),
      manualPayments: payments.map((p) => ({
        id: p.id,
        date: p.date,
        party: p.farmer?.name ?? p.retailer?.name ?? 'General',
        amount: Number(p.amount),
        paymentMode: p.paymentType,
        reference: p.reference,
        notes: p.notes,
        type: p.direction,
        source: 'MANUAL',
      })),
      summary: {
        totalOutgoing: totalFarmerPaid + totalManualOut,
        totalIncoming: totalRetailerCollected + totalManualIn,
        net: totalRetailerCollected + totalManualIn - totalFarmerPaid - totalManualOut,
      },
    };
  }

  async getReceivablesReport(organizationId: string) {
    const [unpaidRetailer, unpaidFarmer] = await Promise.all([
      this.prisma.retailerInvoice.findMany({
        where: { organizationId, isPaid: false },
        include: { retailer: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.farmerInvoice.findMany({
        where: { organizationId, isPaid: false },
        include: { farmer: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const today = new Date();
    const agingBuckets = (invoices: typeof unpaidRetailer | typeof unpaidFarmer) => {
      const result = { current: 0, over30: 0, over60: 0, over90: 0 };
      for (const inv of invoices) {
        const days = Math.floor((today.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
        const amt = Number((inv as { netAmount: unknown }).netAmount);
        if (days <= 30) result.current += amt;
        else if (days <= 60) result.over30 += amt;
        else if (days <= 90) result.over60 += amt;
        else result.over90 += amt;
      }
      return result;
    };

    return {
      receivables: unpaidRetailer.map((i) => ({
        id: i.id,
        date: i.date,
        retailer: i.retailer.name,
        amount: Number(i.netAmount),
        daysOutstanding: Math.floor((today.getTime() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      payables: unpaidFarmer.map((i) => ({
        id: i.id,
        date: i.date,
        farmer: i.farmer.name,
        amount: Number(i.netAmount),
        daysOutstanding: Math.floor((today.getTime() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      summary: {
        totalReceivables: unpaidRetailer.reduce((s, i) => s + Number(i.netAmount), 0),
        totalPayables: unpaidFarmer.reduce((s, i) => s + Number(i.netAmount), 0),
        net:
          unpaidRetailer.reduce((s, i) => s + Number(i.netAmount), 0) -
          unpaidFarmer.reduce((s, i) => s + Number(i.netAmount), 0),
        receivableAging: agingBuckets(unpaidRetailer),
        payableAging: agingBuckets(unpaidFarmer),
      },
    };
  }
}
