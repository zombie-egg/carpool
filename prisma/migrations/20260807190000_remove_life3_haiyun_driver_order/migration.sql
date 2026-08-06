UPDATE "CarpoolOrder"
SET "deletedByCustomer" = true, "deletedByDriver" = true
WHERE "departLocation" = '生活三区'
  AND "destination" = '海韵广场'
  AND "departTime" >= TIMESTAMP '2026-08-08 00:43:00'
  AND "departTime" < TIMESTAMP '2026-08-08 00:45:00'
  AND "id" IN (SELECT "carpoolOrderId" FROM "DriverBookingRequest" WHERE "carpoolOrderId" IS NOT NULL);
