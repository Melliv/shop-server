import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dtos/order-update.dto';
import { UpdateOrderProductDto } from './dtos/update-order-product.dto';

@Controller('api/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('/:order_id')
  async getOrder(@Param('order_id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  async createOrder() {
    return this.ordersService.create();
  }

  @Patch('/:order_id')
  @Header('content-type', 'application/json')
  async updateOrder(
    @Param('order_id') id: string,
    @Body() data: UpdateOrderDto,
  ) {
    await this.ordersService.update(id, data);
    return '"OK"';
  }

  @Get('/:order_id/products')
  async getOrderProducts(@Param('order_id') id: string) {
    return this.ordersService.findOrderProducts(id);
  }

  @Post('/:order_id/products')
  @Header('content-type', 'application/json')
  async addProductsToOrder(
    @Param('order_id') id: string,
    @Body() product_ids: number[],
  ) {
    if (!Array.isArray(product_ids)) {
      throw new BadRequestException('Invalid parameters');
    }

    await this.ordersService.addProductsToOrder(id, product_ids);
    return '"OK"';
  }

  @Patch('/:order_id/products/:product_id')
  @Header('content-type', 'application/json')
  async updateOrderProduct(
    @Param('order_id') id: string,
    @Param('product_id') product_id: string,
    @Body() data: UpdateOrderProductDto,
  ) {
    if (data.quantity) {
      await this.ordersService.updateOrderProductQuantity(
        id,
        product_id,
        data.quantity,
      );
    } else if (data.replaced_with) {
      await this.ordersService.replaceOrderProduct(
        id,
        product_id,
        data.replaced_with,
      );
    } else {
      throw new NotFoundException();
    }

    return '"OK"';
  }
}
