import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateOrderDto } from './dtos/order-update.dto';
import { order_status_type } from './enums/order-status-type';
import { OrderMapper } from './order.mapper';
import { ReplaceWithProduct } from './dtos/update-order-product.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderMapper: OrderMapper,
  ) {}

  async findOne(id: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        amount: true,
        products_on_orders: {
          include: {
            product: true,
            replaced_products_on_order: { include: { product: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException();
    }

    return this.orderMapper.orderToOrderDto(order);
  }

  async create(): Promise<any> {
    const order = await this.prisma.order.create({
      data: {
        amount: {
          create: {},
        },
      },
      include: {
        amount: true,
        products_on_orders: { include: { product: true } },
      },
    });

    return this.orderMapper.orderToOrderDto(order);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    if (
      updateOrderDto.status !== order_status_type.PAID ||
      order.status === order_status_type.PAID
    ) {
      throw new BadRequestException('Invalid order status');
    }
    try {
      await this.prisma.order.update({
        where: { id },
        data: {
          status: updateOrderDto.status,
          amount: {
            update: {
              paid: order.amount.total,
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findOrderProducts(id: string) {
    const order = await this.findOne(id);
    return order.products;
  }

  async addProductsToOrder(id: string, product_ids: number[]) {
    const order = await this.findOne(id);

    const products = await this.prisma.product.findMany({
      where: { id: { in: product_ids } },
      select: { id: true, price: true },
    });
    if (product_ids.length !== products.length) {
      throw new BadRequestException('Invalid parameters');
    }

    const transactions = [];
    for (const product of products) {
      const productsToOrder = order.products.find(
        (p) => p.product_id === product.id,
      );
      if (productsToOrder) {
        productsToOrder.quantity += 1;
        transactions.push(
          this.prisma.productsOnOrders.update({
            where: { id: productsToOrder.id },
            data: { quantity: productsToOrder.quantity },
          }),
        );
      } else {
        order.products.push({
          quantity: 1,
          price: product.price,
        });
        transactions.push(
          this.prisma.productsOnOrders.create({
            data: { order_id: id, product_id: product.id },
          }),
        );
      }
    }
    await this.prisma.$transaction(transactions);
    await this.updateOrderAmount(order);
  }

  async updateOrderProductQuantity(
    id: string,
    product_id: string,
    quantity: number,
  ) {
    const order = await this.findOne(id);

    if (order.status === order_status_type.PAID) {
      throw new BadRequestException('Invalid parameters');
    }

    const product = order.products.find((p) => p.id === product_id);
    if (!product) {
      throw new NotFoundException();
    }
    product.quantity = quantity;

    await this.prisma.productsOnOrders.update({
      where: { id: product.id },
      data: { quantity },
    });
    await this.updateOrderAmount(order);
  }

  async replaceOrderProduct(
    id: string,
    product_id: string,
    replaceWithProduct: ReplaceWithProduct,
  ) {
    const order = await this.findOne(id);

    if (order.status !== order_status_type.PAID) {
      throw new BadRequestException('Invalid parameters');
    }

    const product = order.products.find((p) => p.id === product_id);
    if (!product) {
      throw new NotFoundException();
    }
    const replaced_product = await this.prisma.product.findUnique({
      where: { id: replaceWithProduct.product_id },
    });
    if (!replaced_product) {
      throw new BadRequestException('Invalid Parameters');
    }

    product.replaced_with = {
      quantity: replaceWithProduct.quantity,
      price: replaced_product.price,
    };
    await this.prisma.productsOnOrders.update({
      where: { id: product.id },
      data: {
        replaced_products_on_order: {
          create: {
            quantity: replaceWithProduct.quantity,
            product_id: replaced_product.id,
          },
        },
      },
    });
    await this.updateOrderAmount(order);
  }

  async updateOrderAmount(order) {
    const calculatePrice = (quantity, price) => quantity * parseFloat(price);

    const calculateReplacementPrice = (product) => {
      if (product.replaced_with) {
        const difference = Math.max(
          product.quantity - product.replaced_with.quantity,
          0,
        );
        const replacedPrice = calculatePrice(
          product.replaced_with.quantity,
          product.replaced_with.price,
        );
        const originalPrice = calculatePrice(difference, product.price);
        return replacedPrice + originalPrice;
      }
      return calculatePrice(product.quantity, product.price);
    };

    const paid = order.products.reduce(
      (acc, product) => acc + calculatePrice(product.quantity, product.price),
      0,
    );
    const total = order.products.reduce(
      (acc, product) => acc + calculateReplacementPrice(product),
      0,
    );

    const returns = Math.max(paid - total, 0);
    const discount = Math.max(total - paid, 0);
    const updatedTotal = Math.min(total, paid);
    const updatedPaid = order.status === order_status_type.PAID ? paid : 0;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        amount: {
          update: {
            total: updatedTotal.toFixed(2),
            paid: updatedPaid.toFixed(2),
            returns: returns.toFixed(2),
            discount: discount.toFixed(2),
          },
        },
      },
    });
  }
}
