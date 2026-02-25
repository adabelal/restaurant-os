-- CreateTable
CREATE TABLE "MusicBand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genre" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicEvent" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'TRANSFER',
    "invoiceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicBand_name_key" ON "MusicBand"("name");

-- AddForeignKey
ALTER TABLE "MusicEvent" ADD CONSTRAINT "MusicEvent_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "MusicBand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
