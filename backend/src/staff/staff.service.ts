import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  create(organizationId: string, dto: CreateStaffDto) {
    return this.prisma.staff.create({
      data: { ...dto, joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined, organizationId },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.staff.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async findOne(organizationId: string, id: string) {
    const s = await this.prisma.staff.findFirst({ where: { id, organizationId } });
    if (!s) throw new NotFoundException('Staff not found');
    return s;
  }

  async update(organizationId: string, id: string, dto: Partial<CreateStaffDto>) {
    await this.findOne(organizationId, id);
    return this.prisma.staff.update({ where: { id }, data: dto });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.staff.update({ where: { id }, data: { isActive: false } });
  }

  getPayrollSummary(organizationId: string) {
    return this.prisma.staff.aggregate({
      where: { organizationId, isActive: true },
      _sum: { salary: true },
      _count: true,
    });
  }
}
