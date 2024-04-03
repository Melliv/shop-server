export {};
require('dotenv').config()
const request = require('supertest');
const port = process.env.PORT || 3000
const baseURL = `http://localhost:${port}/api`;

describe('GET /products', () => {
  it('should return 200', async () => {
    const res = await request(baseURL).get('/products');

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual([
      {
        id: 123,
        name: 'Ketchup',
        price: '0.45',
      },
      {
        id: 456,
        name: 'Beer',
        price: '2.33',
      },
      {
        id: 879,
        name: 'Õllesnäkk',
        price: '0.42',
      },
      {
        id: 999,
        name: '75" OLED TV',
        price: '1333.37',
      },
    ]);
  });
});
