import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = [
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
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
