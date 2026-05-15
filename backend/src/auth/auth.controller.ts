import { Controller, Post, Body, Get, Res, UseGuards, HttpCode, Param, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000 };

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    res.cookie('access_token', result.access_token, COOKIE_OPTS);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    res.cookie('access_token', result.access_token, COOKIE_OPTS);
    return result;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }

  @Post('accept-invite')
  @HttpCode(200)
  async acceptInvite(
    @Body() body: { token: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.acceptInvite(body.token, body.password);
    res.cookie('access_token', result.access_token, COOKIE_OPTS);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }

  // ── Multi-org membership ─────────────────────────────────────────────────

  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  getMemberships(@CurrentUser() user: { id: string }) {
    return this.auth.getMemberships(user.id);
  }

  @Post('switch-org/:orgId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async switchOrg(
    @CurrentUser() user: { id: string },
    @Param('orgId') orgId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.switchOrg(user.id, orgId);
    res.cookie('access_token', result.access_token, COOKIE_OPTS);
    return result;
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: { id: string; email: string; organizationId: string; role: Role } },
    @Res() res: Response,
  ) {
    const result = await this.auth.googleLogin(req.user);
    res.cookie('access_token', result.access_token, COOKIE_OPTS);
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/dashboard`);
  }
}
