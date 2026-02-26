
import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { TasksService } from './tasks.service';
import * as jwt from 'jsonwebtoken';

@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  private userId(auth: string) {
    return (jwt.decode(auth.replace('Bearer ', '')) as any).sub;
  }

  @Get()
  find(@Headers('authorization') auth: string) {
    return this.tasks.findAll(this.userId(auth));
  }

  @Post()
  create(@Headers('authorization') auth: string, @Body() b: any) {
    return this.tasks.create(this.userId(auth), b.title);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() b: any) {
    return this.tasks.update(id, b);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tasks.delete(id);
  }
}
