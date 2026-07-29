CREATE TABLE "TripParticipant" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TripParticipant_tripId_userId_key"
ON "TripParticipant"("tripId", "userId");

CREATE INDEX "TripParticipant_userId_idx" ON "TripParticipant"("userId");

ALTER TABLE "TripParticipant"
ADD CONSTRAINT "TripParticipant_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "CarpoolOrder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TripParticipant"
ADD CONSTRAINT "TripParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
