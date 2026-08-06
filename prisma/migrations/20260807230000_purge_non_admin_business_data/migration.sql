-- Preserve administrator accounts plus VIP and merchant promotion data.
-- Remove all customer/driver accounts and every business record belonging to them.
DELETE FROM "TripParticipant";
DELETE FROM "DriverBookingRequest";
DELETE FROM "CarpoolOrder";

DELETE FROM "DriverInfo"
WHERE "userId" IS NULL
   OR "userId" IN (SELECT "id" FROM "User" WHERE "isAdmin" = false);

DELETE FROM "WechatLoginTicket";
DELETE FROM "WechatRegistrationTicket";
DELETE FROM "EmailCode";

DELETE FROM "User"
WHERE "isAdmin" = false;
