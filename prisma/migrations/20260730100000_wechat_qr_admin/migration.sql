ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "WechatLoginTicket" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WechatLoginTicket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WechatLoginTicket_token_key" ON "WechatLoginTicket"("token");
CREATE INDEX "WechatLoginTicket_expiresAt_idx" ON "WechatLoginTicket"("expiresAt");
