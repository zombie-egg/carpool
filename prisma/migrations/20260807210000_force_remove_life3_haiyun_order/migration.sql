UPDATE "CarpoolOrder"
SET "deletedByCustomer" = true,
    "deletedByDriver" = true,
    "hiddenByOrganizer" = true
WHERE "departLocation" = '生活三区'
  AND "destination" = '海韵广场'
  AND "totalPrice" = 40
  AND "id" IN (
    SELECT "carpoolOrderId"
    FROM "DriverBookingRequest"
    WHERE "carpoolOrderId" IS NOT NULL
      AND COALESCE("finalPrice", 0) = 40
  );

UPDATE "DriverBookingRequest"
SET "status" = 'cancelled'
WHERE "carpoolOrderId" IN (
  SELECT "id"
  FROM "CarpoolOrder"
  WHERE "departLocation" = '生活三区'
    AND "destination" = '海韵广场'
    AND "totalPrice" = 40
);
