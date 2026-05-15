import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getProfitLoss(organizationId: string, dateFrom: string, dateTo: string) {
    const dateFilter = { gte: new Date(dateFrom), lte: new Date(dateTo) };

    const [retailerRevenue, farmerCosts, paidRetailer, paidFarmer, staffList] = await Promise.all([
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId, date: dateFilter },
        _sum: { netAmount: true },
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId, date: dateFilter },
        _sum: { netAmount: true },
      }),
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId, date: dateFilter, isPaid: true },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId, date: dateFilter, isPaid: true },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.staff.findMany({ where: { organizationId, isActive: true } }),
    ]);

    const monthsInRange =
      Math.max(
        1,
        Math.round(
          (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      );

    const totalSalaries = staffList.reduce((s, e) => s + Number(e.salary), 0) * monthsInRange;
    const revenue = Number(retailerRevenue._sum.netAmount ?? 0);
    const farmerPayouts = Number(farmerCosts._sum.netAmount ?? 0);
    const totalCosts = farmerPayouts + totalSalaries;
    const grossProfit = revenue - farmerPayouts;
    const netProfit = revenue - totalCosts;

    return {
      revenue,
      farmerPayouts,
      staffSalaries: totalSalaries,
      totalCosts,
      grossProfit,
      netProfit,
      paidRevenue: Number(paidRetailer._sum.netAmount ?? 0),
      paidFarmerCosts: Number(paidFarmer._sum.netAmount ?? 0),
      unpaidRevenue: revenue - Number(paidRetailer._sum.netAmount ?? 0),
      unpaidFarmerCosts: farmerPayouts - Number(paidFarmer._sum.netAmount ?? 0),
    };
  }

  async getBalanceSheet(organizationId: string) {
    const [
      unpaidRetailer,
      unpaidFarmer,
      totalRetailer,
      totalFarmer,
      staffList,
      allRetailerPaid,
      allFarmerPaid,
    ] = await Promise.all([
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
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.staff.findMany({ where: { organizationId, isActive: true } }),
      this.prisma.retailerInvoice.aggregate({
        where: { organizationId, isPaid: true },
        _sum: { netAmount: true },
      }),
      this.prisma.farmerInvoice.aggregate({
        where: { organizationId, isPaid: true },
        _sum: { netAmount: true },
      }),
    ]);

    const monthlyPayroll = staffList.reduce((s, e) => s + Number(e.salary), 0);

    return {
      assets: {
        receivables: {
          amount: Number(unpaidRetailer._sum.netAmount ?? 0),
          count: unpaidRetailer._count,
          label: 'Retailer Receivables (Unpaid)',
        },
        totalRevenue: {
          amount: Number(totalRetailer._sum.netAmount ?? 0),
          label: 'Total Revenue Billed',
        },
        collectedRevenue: {
          amount: Number(allRetailerPaid._sum.netAmount ?? 0),
          label: 'Revenue Collected',
        },
      },
      liabilities: {
        payables: {
          amount: Number(unpaidFarmer._sum.netAmount ?? 0),
          count: unpaidFarmer._count,
          label: 'Farmer Payables (Unpaid)',
        },
        totalFarmerBilled: {
          amount: Number(totalFarmer._sum.netAmount ?? 0),
          label: 'Total Farmer Costs Billed',
        },
        paidFarmerCosts: {
          amount: Number(allFarmerPaid._sum.netAmount ?? 0),
          label: 'Farmer Costs Paid',
        },
      },
      payroll: {
        monthlyPayroll,
        staffCount: staffList.length,
      },
      netPosition:
        Number(unpaidRetailer._sum.netAmount ?? 0) - Number(unpaidFarmer._sum.netAmount ?? 0),
    };
  }
}
