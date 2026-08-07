-- CreateEnum
CREATE TYPE "ProductSauceMode" AS ENUM ('NONE', 'SINGLE', 'MULTIPLE');
CREATE TYPE "SaucePlacement" AS ENUM ('ON_PRODUCT', 'SEPARATE');

-- CreateTable
CREATE TABLE "Sauce" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sauce_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSauce" (
    "productId" TEXT NOT NULL,
    "sauceId" TEXT NOT NULL,

    CONSTRAINT "ProductSauce_pkey" PRIMARY KEY ("productId","sauceId")
);

CREATE TABLE "OrderItemSauce" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sauceId" TEXT NOT NULL,
    "sauceName" TEXT NOT NULL,
    "placement" "SaucePlacement" NOT NULL DEFAULT 'ON_PRODUCT',

    CONSTRAINT "OrderItemSauce_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sauceMode" "ProductSauceMode" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Product" ADD COLUMN "allowSauceSeparate" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "ProductSauce" ADD CONSTRAINT "ProductSauce_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSauce" ADD CONSTRAINT "ProductSauce_sauceId_fkey" FOREIGN KEY ("sauceId") REFERENCES "Sauce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemSauce" ADD CONSTRAINT "OrderItemSauce_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItemSauce" ADD CONSTRAINT "OrderItemSauce_sauceId_fkey" FOREIGN KEY ("sauceId") REFERENCES "Sauce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
