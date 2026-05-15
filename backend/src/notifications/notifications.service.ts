import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, channel?: string, unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
        ...(channel && channel !== 'ALL' ? { channel: channel as never } : {}),
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markRead(organizationId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, organizationId },
      data: { isRead: true },
    });
  }

  async markAllRead(organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { organizationId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(organizationId: string) {
    const count = await this.prisma.notification.count({
      where: { organizationId, isRead: false },
    });
    return { count };
  }
}
