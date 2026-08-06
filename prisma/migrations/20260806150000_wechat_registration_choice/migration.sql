CREATE TABLE "WechatRegistrationTicket" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "openId" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "loginTicket" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WechatRegistrationTicket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WechatRegistrationTicket_token_key" ON "WechatRegistrationTicket"("token");
CREATE INDEX "WechatRegistrationTicket_expiresAt_idx" ON "WechatRegistrationTicket"("expiresAt");
