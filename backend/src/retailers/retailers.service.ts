import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class RetailersService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreateRetailerDto) {
    return this.prisma.retailer.create({ data: { ...dto, organizationId } });
  }

  findAll(organizationId: string) {
    return this.prisma.retailer.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async findOne(organizationId: string, id: string) {
    const r = await this.prisma.retailer.findFirst({ where: { id, organizationId } });
    if (!r) throw new NotFoundException('Retailer not found');
    return r;
  }

  async update(organizationId: string, id: string, dto: UpdateRetailerDto) {
    await this.findOne(organizationId, id);
    return this.prisma.retailer.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.retailer.update({ where: { id }, data: { isActive: false } });
  }
}
