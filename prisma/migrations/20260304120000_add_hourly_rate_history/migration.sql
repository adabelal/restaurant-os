-- CreateTable
CREATE TABLE "HourlyRateHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HourlyRateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HourlyRateHistory_userId_startDate_idx" ON "HourlyRateHistory"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "HourlyRateHistory" ADD CONSTRAINT "HourlyRateHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
