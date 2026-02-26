
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {},
    create: { email: 'test@test.com', password }
  });
  await prisma.task.createMany({
    data: [
      { title: 'First task', userId: user.id },
      { title: 'Second task', userId: user.id, completed: true }
    ]
  });
}
main().finally(() => prisma.$disconnect());
