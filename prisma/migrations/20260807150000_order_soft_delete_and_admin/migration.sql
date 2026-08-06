ALTER TABLE "CarpoolOrder" ADD COLUMN IF NOT EXISTS "hiddenByOrganizer" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isAdmin" = true WHERE "nickname" = '林云汀' AND "wechatOpenId" IS NOT NULL;
