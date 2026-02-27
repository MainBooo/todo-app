import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string, date?: string) {
    const where: any = { userId };
    if (date) where.date = date;
    return this.prisma.task.findMany({ where, orderBy: { scheduledAt: 'asc' } });
  }
  create(userId: string, title: string, scheduledAt?: string, date?: string) {
    return this.prisma.task.create({ data: { title, userId, scheduledAt, date } });
  }
  createMany(userId: string, tasks: { title: string; scheduledAt?: string; date?: string }[]) {
    return this.prisma.task.createMany({
      data: tasks.map(t => ({ title: t.title, userId, scheduledAt: t.scheduledAt, date: t.date }))
    });
  }
  update(id: string, data: any) {
    return this.prisma.task.update({ where: { id }, data });
  }
  delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
