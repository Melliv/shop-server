-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "amount_id" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Order_amount_id_fkey" FOREIGN KEY ("amount_id") REFERENCES "Amount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Amount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discount" TEXT NOT NULL DEFAULT '0.00',
    "paid" TEXT NOT NULL DEFAULT '0.00',
    "returns" TEXT NOT NULL DEFAULT '0.00',
    "total" TEXT NOT NULL DEFAULT '0.00'
);

-- CreateTable
CREATE TABLE "ProductsOnOrders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order_id" TEXT,
    "product_id" INTEGER NOT NULL,
    "replaced_products_on_order_id" TEXT,
    CONSTRAINT "ProductsOnOrders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductsOnOrders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductsOnOrders_replaced_products_on_order_id_fkey" FOREIGN KEY ("replaced_products_on_order_id") REFERENCES "ProductsOnOrders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
