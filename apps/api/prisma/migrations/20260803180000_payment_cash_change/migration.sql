-- Monto recibido y vuelto en cobros en efectivo
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountReceived" DECIMAL(10,2);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "changeAmount" DECIMAL(10,2);
