-- AlterEnum
ALTER TYPE "InvoiceProcessingStatus" ADD VALUE 'TO_VALIDATE';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "amountHT" DECIMAL(10,2),
ADD COLUMN     "confidence" DECIMAL(3,2),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "lineItems" JSONB,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "supplierAddress" TEXT,
ADD COLUMN     "supplierSiret" TEXT,
ADD COLUMN     "vatAmount" DECIMAL(10,2),
ADD COLUMN     "vatRate" DECIMAL(5,2),
ADD COLUMN     "embedding" JSONB;

-- CreateIndex
CREATE INDEX "Invoice_supplierName_idx" ON "Invoice"("supplierName");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
