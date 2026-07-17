-- AlterTable
ALTER TABLE "RestaurantSettings" ADD COLUMN "publicMenuOpenTime" TEXT DEFAULT '08:00';
ALTER TABLE "RestaurantSettings" ADD COLUMN "publicMenuCloseTime" TEXT DEFAULT '22:00';
