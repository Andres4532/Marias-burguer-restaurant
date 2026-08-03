-- Fecha del pedido para numeración diaria (#001 cada día en America/La_Paz)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderDate" DATE;

UPDATE "Order"
SET "orderDate" = (timezone('America/La_Paz', "createdAt"))::date
WHERE "orderDate" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderDate" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Order_orderDate_orderNumber_idx"
  ON "Order"("orderDate", "orderNumber");
