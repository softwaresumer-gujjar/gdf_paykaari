import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  isBlocked: true, inviteToken: true, allowedPages: true,
  department: true, position: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async invite(organizationId: string, data: { name: string; email: string; role?: Role; department?: string; position?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const placeholder = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: placeholder,
        role: data.role ?? Role.VIEWER,
        isBlocked: true,
        inviteToken,
        department: data.department,
        position: data.position,
        organizationId,
      },
      select: USER_SELECT,
    });

    return { ...user, inviteUrl: `/accept-invite?token=${inviteToken}` };
  }

  async updateRole(organizationId: string, userId: string, role: Role) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: USER_SELECT,
    });
  }

  async updatePermissions(organizationId: string, userId: string, allowedPages: string[]) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { allowedPages },
      select: USER_SELECT,
    });
  }

  async setBlocked(organizationId: string, userId: string, isBlocked: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN && isBlocked) throw new BadRequestException('Cannot block the admin');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
      select: USER_SELECT,
    });
  }

  async resetPassword(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    const inviteToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({ where: { id: userId }, data: { inviteToken } });
    return { inviteToken, inviteUrl: `/accept-invite?token=${inviteToken}` };
  }

  async remove(organizationId: string, userId: string, requesterId: string) {
    if (userId === requesterId) throw new BadRequestException('Cannot delete your own account');
    const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) throw new BadRequestException('Cannot delete admin user');
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
