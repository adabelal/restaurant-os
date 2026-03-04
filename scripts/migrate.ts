import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Running manual migration for HourlyRateHistory...')
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "HourlyRateHistory" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rate" DECIMAL(10,2) NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "HourlyRateHistory_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('Table HourlyRateHistory created or already exists.');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "HourlyRateHistory_userId_startDate_idx" ON "HourlyRateHistory"("userId", "startDate");
    `;
    console.log('Index created or already exists.');

    try {
        await prisma.$executeRaw`
            ALTER TABLE "HourlyRateHistory" ADD CONSTRAINT "HourlyRateHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `;
        console.log('Foreign key added.');
    } catch (e) {
        console.log('Foreign key might already exist.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
