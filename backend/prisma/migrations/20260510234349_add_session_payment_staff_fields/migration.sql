-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'ONLINE', 'OTHER');

-- AlterTable
ALTER TABLE "CollectionEntry" ADD COLUMN     "session" "RateSession" NOT NULL DEFAULT 'MORNING';

-- AlterTable
ALTER TABLE "DeliveryEntry" ADD COLUMN     "session" "RateSession" NOT NULL DEFAULT 'MORNING';

-- AlterTable
ALTER TABLE "FarmerInvoice" ADD COLUMN     "paymentMode" "PaymentMode",
ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "RetailerInvoice" ADD COLUMN     "paymentMode" "PaymentMode",
ADD COLUMN     "paymentReference" TEXT;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "email" TEXT,
ADD COLUMN     "nic" TEXT,
ADD COLUMN     "photoUrl" TEXT;
