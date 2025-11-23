/*
  Warnings:

  - You are about to drop the column `price` on the `PatientOrder` table. All the data in the column will be lost.
  - You are about to drop the column `reportId` on the `PatientOrder` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `PatientOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `PatientOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `PatientReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `PatientReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `reportId` on table `PatientReport` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PatientOrder" DROP CONSTRAINT "PatientOrder_reportId_fkey";

-- AlterTable
ALTER TABLE "PatientOrder" DROP COLUMN "price",
DROP COLUMN "reportId",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "PatientReport" ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "reportId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientReport" ADD CONSTRAINT "PatientReport_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PatientOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
