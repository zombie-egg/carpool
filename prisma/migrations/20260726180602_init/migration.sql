-- CreateTable
CREATE TABLE "CarpoolOrder" (
    "id" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "departLocation" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departTime" TIMESTAMP(3) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "remainingSeats" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "contactType" TEXT NOT NULL,
    "wechatId" TEXT,
    "phoneNumber" TEXT,
    "remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarpoolOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverInfo" (
    "id" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wechat" TEXT,
    "licensePlate" TEXT NOT NULL,
    "operationStartDate" DATE NOT NULL,
    "operationEndDate" DATE NOT NULL,
    "dailyAvailableStart" TEXT NOT NULL,
    "dailyAvailableEnd" TEXT NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "carType" TEXT NOT NULL,
    "carRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarpoolOrder_departTime_idx" ON "CarpoolOrder"("departTime");

-- CreateIndex
CREATE INDEX "CarpoolOrder_status_idx" ON "CarpoolOrder"("status");

-- CreateIndex
CREATE INDEX "DriverInfo_operationEndDate_idx" ON "DriverInfo"("operationEndDate");
