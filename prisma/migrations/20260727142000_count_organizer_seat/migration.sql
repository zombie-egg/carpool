-- Existing trips were created without counting the organizer as a rider.
-- Reserve the organizer's seat while preserving all passenger joins.
UPDATE "CarpoolOrder"
SET "remainingSeats" = GREATEST("remainingSeats" - 1, 0);

UPDATE "CarpoolOrder"
SET "status" = 'full'
WHERE "remainingSeats" = 0 AND "status" = 'recruiting';
