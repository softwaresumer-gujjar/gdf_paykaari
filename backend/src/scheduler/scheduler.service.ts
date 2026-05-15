import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleFrequency, ScheduleType } from '@prisma/client';

@Injectable()
export class SchedulerService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.notificationSchedule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  get(organizationId: string, id: string) {
    return this.prisma.notificationSchedule.findFirst({
      where: { id, organizationId },
    });
  }

  create(organizationId: string, data: {
    name: string;
    type: ScheduleType;
    frequency: ScheduleFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
    channels: string[];
    recipientType: string;
    specificIds?: string[];
  }) {
    const nextRunAt = this.computeNextRun(data.frequency, data.hour, data.minute, data.dayOfWeek, data.dayOfMonth);
    return this.prisma.notificationSchedule.create({
      data: {
        name: data.name,
        type: data.type,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek ?? null,
        dayOfMonth: data.dayOfMonth ?? null,
        hour: data.hour,
        minute: data.minute,
        channels: data.channels,
        recipientType: data.recipientType,
        specificIds: data.specificIds ?? undefined,
        nextRunAt,
        organizationId,
      },
    });
  }

  async update(organizationId: string, id: string, data: Partial<{
    name: string;
    type: ScheduleType;
    frequency: ScheduleFrequency;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    hour: number;
    minute: number;
    channels: string[];
    recipientType: string;
    specificIds: string[] | null;
    isActive: boolean;
  }>) {
    const existing = await this.prisma.notificationSchedule.findFirst({ where: { id, organizationId } });
    if (!existing) throw new Error('Schedule not found');

    const freq = data.frequency ?? existing.frequency;
    const hour = data.hour ?? existing.hour;
    const minute = data.minute ?? existing.minute;
    const dow = 'dayOfWeek' in data ? data.dayOfWeek : existing.dayOfWeek;
    const dom = 'dayOfMonth' in data ? data.dayOfMonth : existing.dayOfMonth;
    const nextRunAt = this.computeNextRun(freq, hour, minute, dow ?? undefined, dom ?? undefined);

    const { specificIds, channels, ...rest } = data;
    return this.prisma.notificationSchedule.update({
      where: { id },
      data: {
        ...rest,
        nextRunAt,
        ...(channels !== undefined ? { channels } : {}),
        ...(specificIds !== undefined ? { specificIds: specificIds ?? undefined } : {}),
      },
    });
  }

  delete(organizationId: string, id: string) {
    return this.prisma.notificationSchedule.deleteMany({ where: { id, organizationId } });
  }

  toggle(organizationId: string, id: string, isActive: boolean) {
    return this.prisma.notificationSchedule.updateMany({
      where: { id, organizationId },
      data: { isActive },
    });
  }

  private computeNextRun(
    frequency: ScheduleFrequency,
    hour: number,
    minute: number,
    dayOfWeek?: number,
    dayOfMonth?: number,
  ): Date {
    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0, 0);
    next.setHours(hour, minute);

    if (frequency === ScheduleFrequency.DAILY) {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === ScheduleFrequency.WEEKLY) {
      const target = dayOfWeek ?? 1;
      const diff = (target - now.getDay() + 7) % 7 || 7;
      next.setDate(now.getDate() + diff);
      if (diff === 0 && next <= now) next.setDate(next.getDate() + 7);
    } else if (frequency === ScheduleFrequency.MONTHLY) {
      const target = dayOfMonth ?? 1;
      next.setDate(target);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(target);
      }
    }

    return next;
  }
}
