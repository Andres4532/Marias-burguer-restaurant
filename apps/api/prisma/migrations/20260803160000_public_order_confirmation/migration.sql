-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDIENTE_CONFIRMACION';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "publicTrackingToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_publicTrackingToken_key" ON "Order"("publicTrackingToken");
