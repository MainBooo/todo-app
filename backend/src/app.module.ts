
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    AuthModule,
    TasksModule
  ],
  providers: [PrismaService]
})
export class AppModule {}
