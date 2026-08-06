-- Remove only the newly-created customer account requested by the owner.
-- Existing drivers, administrators and accounts with another nickname are untouched.
DELETE FROM "User" WHERE "nickname" = '林云汀' AND "role" = 'customer' AND "isAdmin" = false;
