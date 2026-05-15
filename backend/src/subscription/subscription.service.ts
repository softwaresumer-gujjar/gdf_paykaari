import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const PLAN_FEATURES = {
  FREE: {
    collection: true,
    delivery: true,
    billing: false,
    reports: false,
    accounts: false,
    transport: false,
    staff: false,
    multiUser: false,
    maxFarmers: 2,
    maxRetailers: 2,
    durationDays: 0,
    price: 0,
    label: 'Free Plan',
  },
  TRIAL: {
    collection: true,
    delivery: true,
    billing: true,
    reports: false,
    accounts: false,
    transport: false,
    staff: false,
    multiUser: false,
    maxFarmers: 3,
    maxRetailers: 3,
    durationDays: 14,
    price: 0,
    label: '2-Week Free Trial',
  },
  BASIC: {
    collection: true,
    delivery: true,
    billing: true,
    reports: true,
    accounts: false,
    transport: false,
    staff: false,
    multiUser: false,
    maxFarmers: 10,
    maxRetailers: 10,
    durationDays: 30,
    price: 2500,
    label: 'Basic Plan',
  },
  STANDARD: {
    collection: true,
    delivery: true,
    billing: true,
    reports: true,
    accounts: true,
    transport: true,
    staff: true,
    multiUser: false,
    maxFarmers: 50,
    maxRetailers: 50,
    durationDays: 30,
    price: 5000,
    label: 'Standard Plan',
  },
  PREMIUM: {
    collection: true,
    delivery: true,
    billing: true,
    reports: true,
    accounts: true,
    transport: true,
    staff: true,
    multiUser: true,
    maxFarmers: -1,
    maxRetailers: -1,
    durationDays: 30,
    price: 9000,
    label: 'Premium Plan',
  },
};

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(organizationId: string) {
    let sub = await this.prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + 14);
      sub = await this.prisma.subscription.create({
        data: {
          organizationId,
          plan: 'TRIAL',
          status: 'ACTIVE',
          startDate: now,
          endDate: end,
          amountPaid: 0,
          features: PLAN_FEATURES.TRIAL,
        },
      });
    }

    const now = new Date();
    const planKey = sub.plan as keyof typeof PLAN_FEATURES;
    const planInfo = PLAN_FEATURES[planKey] ?? PLAN_FEATURES.FREE;
    const isFree = (sub.plan as string) === 'FREE';

    const endDate = new Date(sub.endDate);
    const daysRemaining = isFree ? null : Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isExpired = !isFree && endDate < now;

    if (isExpired && sub.status === 'ACTIVE') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      sub = { ...sub, status: 'EXPIRED' };
    }

    const isTrial = sub.plan === 'TRIAL';
    const isExpiring = !isFree && !isExpired && (daysRemaining ?? 99) <= 7;

    return {
      id: sub.id,
      plan: sub.plan,
      planLabel: planInfo.label,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      daysRemaining,
      isTrial,
      isFree,
      isExpiring,
      isExpired: sub.status === 'EXPIRED',
      isReadonly: sub.status === 'EXPIRED',
      amountPaid: Number(sub.amountPaid),
      features: planInfo,
      notes: sub.notes,
      allPlans: Object.entries(PLAN_FEATURES).map(([key, val]) => ({ key, ...val })),
    };
  }

  async getHistory(organizationId: string) {
    return this.prisma.subscription.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
