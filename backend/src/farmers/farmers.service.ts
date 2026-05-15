import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

@Injectable()
export class FarmersService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreateFarmerDto) {
    return this.prisma.farmer.create({
      data: { ...dto, organizationId },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.farmer.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const farmer = await this.prisma.farmer.findFirst({ where: { id, organizationId } });
    if (!farmer) throw new NotFoundException('Farmer not found');
    return farmer;
  }

  async update(organizationId: string, id: string, dto: UpdateFarmerDto) {
    await this.findOne(organizationId, id);
    return this.prisma.farmer.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.farmer.update({ where: { id }, data: { isActive: false } });
  }

  async getStats(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    const entries = await this.prisma.collectionEntry.findMany({
      where: { farmerId: id, organizationId },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const totalCollected = entries.reduce((s, e) => s + Number(e.collectedMaunds), 0);
    const qualityPassRate = entries.length
      ? (entries.filter((e) => e.qualityPassed).length / entries.length) * 100
      : 100;
    return { entries, totalCollected, qualityPassRate };
  }
}
