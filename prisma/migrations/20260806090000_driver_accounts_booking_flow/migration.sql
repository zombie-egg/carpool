ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE "DriverInfo" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "DriverInfo_userId_key" ON "DriverInfo"("userId");
ALTER TABLE "DriverInfo" ADD CONSTRAINT "DriverInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DriverBookingRequest" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "departLocation" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "departTime" TIMESTAMP(3) NOT NULL,
  "totalSeats" INTEGER NOT NULL,
  "estimatedPrice" DECIMAL(10,2) NOT NULL,
  "finalPrice" DECIMAL(10,2),
  "customerContactType" TEXT NOT NULL,
  "customerContactValue" TEXT NOT NULL,
  "remark" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "carpoolOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriverBookingRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverBookingRequest_carpoolOrderId_key" ON "DriverBookingRequest"("carpoolOrderId");
CREATE INDEX "DriverBookingRequest_customerId_createdAt_idx" ON "DriverBookingRequest"("customerId", "createdAt");
CREATE INDEX "DriverBookingRequest_driverId_status_createdAt_idx" ON "DriverBookingRequest"("driverId", "status", "createdAt");
ALTER TABLE "DriverBookingRequest" ADD CONSTRAINT "DriverBookingRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverBookingRequest" ADD CONSTRAINT "DriverBookingRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverBookingRequest" ADD CONSTRAINT "DriverBookingRequest_carpoolOrderId_fkey" FOREIGN KEY ("carpoolOrderId") REFERENCES "CarpoolOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
