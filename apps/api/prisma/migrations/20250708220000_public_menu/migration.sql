-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('CAJA', 'MENU_PUBLICO');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "source" "OrderSource" NOT NULL DEFAULT 'CAJA';

-- CreateIndex
CREATE INDEX "Order_source_status_idx" ON "Order"("source", "status");

-- CreateTable
CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Mi Restaurante',
    "slug" TEXT NOT NULL DEFAULT 'mi-restaurante',
    "phone" TEXT,
    "publicMenuEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantSettings_slug_key" ON "RestaurantSettings"("slug");
