ALTER TABLE "RestaurantSettings" ADD COLUMN "qrImageUrl" TEXT;

ALTER TABLE "Order" ADD COLUMN "customerPaymentMethod" "PaymentMethod";
ALTER TABLE "Order" ADD COLUMN "paymentProofUrl" TEXT;
