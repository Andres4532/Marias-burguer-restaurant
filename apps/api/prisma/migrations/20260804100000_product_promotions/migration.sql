-- CreateEnum
CREATE TYPE "ProductPromoType" AS ENUM ('NONE', 'PERCENT', 'FIXED_PRICE');

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "promoType" "ProductPromoType" NOT NULL DEFAULT 'NONE',
ADD COLUMN "promoValue" DECIMAL(10,2),
ADD COLUMN "promoStartsAt" TIMESTAMP(3),
ADD COLUMN "promoEndsAt" TIMESTAMP(3);
