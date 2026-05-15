import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { organizationId: string },
    @Query('channel') channel?: string,
    @Query('unread') unread?: string,
  ) {
    return this.service.findAll(user.organizationId, channel, unread === 'true');
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { organizationId: string }) {
    return this.service.getUnreadCount(user.organizationId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.service.markRead(user.organizationId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: { organizationId: string }) {
    return this.service.markAllRead(user.organizationId);
  }
}
