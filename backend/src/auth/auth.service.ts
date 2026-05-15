import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    let organizationId: string;

    if (dto.organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: dto.organizationId } });
      if (!org) throw new BadRequestException('Organization not found');
      organizationId = org.id;
    } else {
      const orgName = dto.organizationName || `${dto.name}'s Business`;
      const org = await this.prisma.organization.create({ data: { name: orgName } });
      organizationId = org.id;
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const isFirstUser = !(await this.prisma.user.findFirst({ where: { organizationId } }));
    const role = isFirstUser ? Role.ADMIN : Role.VIEWER;

    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash: hash, role, organizationId },
    });

    await this.prisma.userMembership.create({
      data: { userId: user.id, organizationId, role },
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.passwordHash) {
      throw new UnauthorizedException('This account uses Google sign-in. Please use "Sign in with Google".');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.inviteToken) throw new UnauthorizedException('Please accept your invite link before signing in');
    if (user.isBlocked) throw new UnauthorizedException('Your account has been blocked. Contact your administrator.');

    await this.ensureMembership(user.id, user.organizationId, user.role);
    return this.signToken(user);
  }

  async acceptInvite(token: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { inviteToken: token } });
    if (!user) throw new BadRequestException('Invalid or expired invite link');

    const hash = await bcrypt.hash(password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, inviteToken: null, isBlocked: false },
    });

    await this.ensureMembership(updated.id, updated.organizationId, updated.role);
    return this.signToken(updated);
  }

  async googleLogin(user: { id: string; email: string; organizationId: string; role: Role }) {
    await this.ensureMembership(user.id, user.organizationId, user.role);
    return this.signToken(user);
  }

  async getMemberships(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    await this.ensureMembership(userId, user.organizationId, user.role);

    const memberships = await this.prisma.userMembership.findMany({
      where: { userId },
      include: { organization: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      role: m.role,
      isActive: m.organizationId === user.organizationId,
    }));
  }

  async switchOrg(userId: string, targetOrgId: string) {
    const membership = await this.prisma.userMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId: targetOrgId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this organization');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: targetOrgId, role: membership.role },
    });

    return this.signToken(user);
  }

  private async ensureMembership(userId: string, organizationId: string, role: Role) {
    await this.prisma.userMembership.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      create: { userId, organizationId, role },
      update: {},
    });
  }

  private signToken(user: { id: string; email: string; organizationId: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, organizationId: user.organizationId, role: user.role };
    const token = this.jwt.sign(payload);
    return { access_token: token, user: { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId } };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        googleId: true,
        organization: { select: { id: true, name: true } },
        _count: { select: { memberships: true } },
      },
    });
  }
}
