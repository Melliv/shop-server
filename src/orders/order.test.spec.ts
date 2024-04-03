require('dotenv').config();
const request = require('supertest');
const port = process.env.PORT || 3000;
const baseURL = `http://localhost:${port}/api`;

async function resShouldBeOk(res, status = 200) {
  expect(res.statusCode).toBe(status);
  expect(res.body).toBe('OK');
}

async function createOrder() {
  const res = await request(baseURL).post('/orders');

  expect(res.statusCode).toBe(201);
  expect(res.body.status).toBe('NEW');
  expect(res.body.amount.discount).toBe('0.00');
  expect(res.body.amount.paid).toBe('0.00');
  expect(res.body.amount.returns).toBe('0.00');
  expect(res.body.amount.total).toBe('0.00');
  expect(res.body.products.length).toBe(0);
  expect(Object.keys(res.body).length).toBe(4);
  return res.body;
}

async function payOrder(order) {
  const res = await request(baseURL)
    .patch(`/orders/${order.id}`)
    .send({ status: 'PAID' });

  resShouldBeOk(res);
}

async function addProductsToOrder(order, productIds) {
  const res = await request(baseURL)
    .post(`/orders/${order.id}/products`)
    .send(productIds);

  resShouldBeOk(res, 201);
}

async function getOrder(order) {
  const res = await request(baseURL).get(`/orders/${order.id}`);

  expect(res.statusCode).toBe(200);
  expect(res.body.id).toBe(order.id);
  return res.body;
}

async function getOrderProducts(order) {
  const res = await request(baseURL).get(`/orders/${order.id}/products`);

  expect(res.statusCode).toBe(200);
  return res.body;
}

async function updateOrderProductQuantity(id, product_id, quantity) {
  const res = await request(baseURL)
    .patch(`/orders/${id}/products/${product_id}`)
    .send({ quantity });

  resShouldBeOk(res);
}

async function replaceOrderProduct(
  id,
  product_id,
  replace_product_id,
  quantity,
) {
  const res = await request(baseURL)
    .patch(`/orders/${id}/products/${product_id}`)
    .send({
      replaced_with: { product_id: replace_product_id, quantity: quantity },
    });

  resShouldBeOk(res);
  return res.body;
}

describe('POST /orders', () => {
  it('should return 201', async () => {
    await createOrder();
  });
});

describe('GET /orders/:order_id', () => {
  let order;
  beforeAll(async () => {
    order = await createOrder();
  });

  it('should return 200', async () => {
    order = await getOrder(order);

    expect(order.status).toBe('NEW');
    expect(order.amount.discount).toBe('0.00');
    expect(order.amount.paid).toBe('0.00');
    expect(order.amount.returns).toBe('0.00');
    expect(order.amount.total).toBe('0.00');
    expect(order.products.length).toBe(0);
    expect(Object.keys(order).length).toBe(4);
  });

  it('should return 404', async () => {
    const res = await request(baseURL).get(`/orders/111`);
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /orders/:order_id', () => {
  let order;
  beforeEach(async () => {
    order = await createOrder();
  });

  it('should return 200', async () => {
    await payOrder(order);
  });

  it('should return 400 if changing PAID to NEW', async () => {
    await payOrder(order);

    const res = await request(baseURL)
      .patch(`/orders/${order.id}`)
      .send({ status: 'NEW' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid order status');
  });

  it('should return 400 if changing PAID to PAID', async () => {
    await payOrder(order);

    const res = await request(baseURL)
      .patch(`/orders/${order.id}`)
      .send({ status: 'PAID' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid order status');
  });

  it('should return 400 if wrong status', async () => {
    const res = await request(baseURL).patch(`/orders/${order.id}`).send({
      status: 'WRONG_STATUS',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid order status');
  });
});

describe('GET /orders/:order_id/products', () => {
  let order;
  beforeAll(async () => {
    order = await createOrder();
  });

  it('should return 200', async () => {
    order.products = await getOrderProducts(order);
    expect(order.products.length).toBe(0);
  });

  it('should return 200', async () => {
    const res = await request(baseURL).get(`/orders/111/products`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toBe('Not found');
  });
});

describe('POST /orders/:order_id/products', () => {
  let order;
  beforeEach(async () => {
    order = await createOrder();
  });

  it('should return 201', async () => {
    await addProductsToOrder(order, [123]);

    order.products = await getOrderProducts(order);
    expect(order.products.length).toBe(1);
    expect(order.products[0].product_id).toBe(123);
    expect(order.products[0].name).toBe('Ketchup');
    expect(order.products[0].price).toBe('0.45');
    expect(order.products[0].quantity).toBe(1);
  });

  it('should return 404', async () => {
    const res = await request(baseURL).post(`/orders/111/products`).send([123]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toBe('Not found');
  });

  it('should return 400', async () => {
    const res = await request(baseURL)
      .post(`/orders/${order.id}/products`)
      .send([321, 123]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid parameters');
  });

  it('should add products detailed', async () => {
    await addProductsToOrder(order, [123, 456, 999]);
    order.products = await getOrderProducts(order);

    expect(order.products.length).toBe(3);
    expect(order.products[0].product_id).toBe(123);
    expect(order.products[0].name).toBe('Ketchup');
    expect(order.products[0].price).toBe('0.45');
    expect(order.products[0].quantity).toBe(1);

    await addProductsToOrder(order, [123, 456]);
    order.products = await getOrderProducts(order);

    expect(order.products.length).toBe(3);
    expect(order.products[0].quantity).toBe(2);
    expect(order.products[1].quantity).toBe(2);
    expect(order.products[2].quantity).toBe(1);
  });

  it('should return 201. Detailed with amount cheking', async () => {
    await addProductsToOrder(order, [123]);

    order = await getOrder(order);
    expect(order.amount.total).toBe('0.45');
    expect(order.amount.paid).toBe('0.00');

    await payOrder(order);
    order = await getOrder(order);

    expect(order.amount.total).toBe('0.45');
    expect(order.amount.paid).toBe('0.45');
  });
});

describe('PATCH /orders/:order_id/products/:product_id      change quantity', () => {
  let order;
  beforeEach(async () => {
    order = await createOrder();
    await addProductsToOrder(order, [123]);
    order = await getOrder(order);
  });

  it('should return 200', async () => {
    await updateOrderProductQuantity(order.id, order.products[0].id, 10);
    order = await getOrder(order);

    expect(order.products.length).toBe(1);
    expect(order.products[0].quantity).toBe(10);
    expect(order.amount.total).toBe('4.50');
  });

  it('should return 400 for paid order', async () => {
    await payOrder(order);
    const res1 = await request(baseURL)
      .patch(`/orders/${order.id}/products/${order.products[0].id}`)
      .send({ quantity: 10 });

    expect(res1.statusCode).toBe(400);
    expect(res1.body).toBe('Invalid parameters');

    order = await getOrder(order);
    expect(order.products.length).toBe(1);
    expect(order.products[0].quantity).toBe(1);
    expect(order.amount.total).toBe('0.45');
  });

  it('should return 404 for missing product_id', async () => {
    const res = await request(baseURL)
      .patch(`/orders/${order.id}/products/111`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(404);
    expect(res.body).toBe('Not found');
  });

  it('should return 400 for negative quantity', async () => {
    const res = await request(baseURL)
      .patch(`/orders/${order.id}/products/${order.products[0].id}`)
      .send({ quantity: -2 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid parameters');
  });
});

describe('PATCH /orders/:order_id/products/:product_id   replace order product', () => {
  let order;
  beforeEach(async () => {
    order = await createOrder();
    await addProductsToOrder(order, [123]);
    order = await getOrder(order);
  });

  it('should return 400 when order is not paid', async () => {
    const res2 = await request(baseURL)
      .patch(`/orders/${order.id}/products/${order.products[0].id}`)
      .send({ replaced_with: { product_id: 123, quantity: 6 } });

    expect(res2.statusCode).toBe(400);
    expect(res2.body).toBe('Invalid parameters');
  });

  it('should return 200 when order is paid', async () => {
    await payOrder(order);
    await replaceOrderProduct(order.id, order.products[0].id, 456, 6);

    order = await getOrder(order);
    expect(order.products[0].replaced_with.quantity).toBe(6);
    expect(order.products[0].replaced_with.product_id).toBe(456);
  });

  it('should return 200 for multi product replacing', async () => {
    await payOrder(order);
    await replaceOrderProduct(order.id, order.products[0].id, 456, 6);
    await replaceOrderProduct(order.id, order.products[0].id, 999, 10);
    order = await getOrder(order);

    expect(order.products[0].replaced_with.quantity).toBe(10);
    expect(order.products[0].replaced_with.product_id).toBe(999);
  });

  it('should return 400 for invalid parameters', async () => {
    const res = await request(baseURL)
      .patch(`/orders/${order.id}/products/${order.products[0].id}`)
      .send({ replaced_with: 123 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBe('Invalid parameters');
  });

  it('should return 200. Amount returns checking', async () => {
    await updateOrderProductQuantity(order.id, order.products[0].id, 5);
    await payOrder(order);
    await replaceOrderProduct(order.id, order.products[0].id, 879, 2);
    order = await getOrder(order);

    expect(order.products[0].replaced_with.quantity).toBe(2);
    expect(order.products[0].replaced_with.product_id).toBe(879);
    expect(order.amount.discount).toBe('0.00');
    expect(order.amount.paid).toBe('2.25');
    expect(order.amount.returns).toBe('0.06');
    expect(order.amount.total).toBe('2.19');
  });

  it('should return 200. Amount discount checking', async () => {
    await addProductsToOrder(order, [123]);
    await payOrder(order);
    await replaceOrderProduct(order.id, order.products[0].id, 456, 7);
    order = await getOrder(order);

    expect(order.products.length).toBe(1);
    expect(order.products[0].quantity).toBe(2);
    expect(order.products[0].product_id).toBe(123);
    expect(order.products[0].replaced_with.quantity).toBe(7);
    expect(order.products[0].replaced_with.product_id).toBe(456);
    expect(order.amount.discount).toBe('15.41');
    expect(order.amount.paid).toBe('0.90');
    expect(order.amount.returns).toBe('0.00');
    expect(order.amount.total).toBe('0.90');
  });

  it('should return 200. Amount discount checking', async () => {
    await addProductsToOrder(order, [123, 456, 999]);
    await payOrder(order);
    order = await getOrder(order);
    await replaceOrderProduct(order.id, order.products[1].id, 879, 3);
    order = await getOrder(order);

    expect(order.products.length).toBe(3);
    expect(order.products[0].quantity).toBe(2);
    expect(order.products[0].product_id).toBe(123);
    expect(order.products[0].replaced_with).toBe(null);
    expect(order.products[1].quantity).toBe(1);
    expect(order.products[1].product_id).toBe(456);
    expect(order.products[1].replaced_with.product_id).toBe(879);
    expect(order.products[1].replaced_with.quantity).toBe(3);
    expect(order.amount.discount).toBe('0.00');
    expect(order.amount.paid).toBe('1336.60');
    expect(order.amount.returns).toBe('1.07');
    expect(order.amount.total).toBe('1335.53');
  });
});
