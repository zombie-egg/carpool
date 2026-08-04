CREATE TABLE "MerchantPromotion" (
    "id" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "poster1" TEXT,
    "poster2" TEXT,
    "poster3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipAdvertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VipAdvertisement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MerchantPromotion_createdAt_idx" ON "MerchantPromotion"("createdAt");
CREATE INDEX "VipAdvertisement_createdAt_idx" ON "VipAdvertisement"("createdAt");
