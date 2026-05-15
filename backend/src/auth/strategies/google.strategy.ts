import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'GOOGLE_NOT_CONFIGURED',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'GOOGLE_NOT_CONFIGURED',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; displayName: string; emails?: { value: string }[] },
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'), undefined);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.id }, { email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      }
      // Ensure membership exists for returning users (handles accounts created before multi-org)
      await this.prisma.userMembership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: user.organizationId } },
        create: { userId: user.id, organizationId: user.organizationId, role: user.role },
        update: {},
      });
    } else {
      const org = await this.prisma.organization.create({
        data: { name: `${profile.displayName}'s Business` },
      });
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          googleId: profile.id,
          role: Role.ADMIN,
          organizationId: org.id,
        },
      });
      await this.prisma.userMembership.create({
        data: { userId: user.id, organizationId: org.id, role: Role.ADMIN },
      });
    }

    done(null, user);
  }
}
