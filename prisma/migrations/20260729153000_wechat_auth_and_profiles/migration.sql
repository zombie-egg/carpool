ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "wechatOpenId" TEXT;

CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "User"("wechatOpenId");
