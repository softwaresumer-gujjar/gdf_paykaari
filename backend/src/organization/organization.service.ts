import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getPublicBranding() {
    const org = await this.prisma.organization.findFirst({
      select: { id: true, name: true },
    });
    if (!org) return { brandName: 'MilkFlow', primaryColor: '#2563eb', accentColor: '#16a34a' };
    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId: org.id },
      select: { brandName: true, tagline: true, logoUrl: true, primaryColor: true, accentColor: true },
    });
    return {
      brandName: settings?.brandName || org.name,
      tagline: settings?.tagline,
      logoUrl: settings?.logoUrl,
      primaryColor: settings?.primaryColor || '#2563eb',
      accentColor: settings?.accentColor || '#16a34a',
    };
  }

  async getSettings(organizationId: string) {
    let settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId },
    });
    if (!settings) {
      const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
      settings = await this.prisma.organizationSettings.create({
        data: {
          organizationId,
          brandName: org?.name,
          primaryColor: '#2563eb',
          accentColor: '#16a34a',
        },
      });
    }
    return settings;
  }

  async updateSettings(organizationId: string, data: Record<string, unknown>) {
    const allowed = [
      'brandName', 'tagline', 'logoUrl', 'primaryColor', 'accentColor',
      'invoiceHeader', 'invoiceFooter', 'signatureUrl', 'signatureName',
      'signatureTitle', 'address', 'phone', 'email', 'website',
      'taxId', 'bankName', 'bankAccount', 'bankIban',
    ];
    const clean = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
    return this.prisma.organizationSettings.upsert({
      where: { organizationId },
      update: clean,
      create: { organizationId, ...clean },
    });
  }
}
