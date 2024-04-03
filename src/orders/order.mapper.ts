import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderMapper {
  orderToOrderDto(order) {
    const products = order.products_on_orders.map((p) => {
      return {
        id: p.id,
        name: p.product.name,
        price: p.product.price,
        product_id: p.product_id,
        quantity: p.quantity,
        replaced_with: p.replaced_products_on_order
          ? {
              id: p.replaced_products_on_order.id,
              name: p.replaced_products_on_order.product.name,
              price: p.replaced_products_on_order.product.price,
              product_id: p.replaced_products_on_order.product_id,
              quantity: p.replaced_products_on_order.quantity,
              replaced_with: null,
            }
          : null,
      };
    });

    delete order.amount.id;
    return {
      id: order.id,
      status: order.status,
      amount: order.amount,
      products: products,
    };
  }
}
