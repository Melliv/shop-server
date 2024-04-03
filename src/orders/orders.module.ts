import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma.service';
import { OrderMapper } from './order.mapper';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, OrderMapper],
})
export class OrdersModule {}
