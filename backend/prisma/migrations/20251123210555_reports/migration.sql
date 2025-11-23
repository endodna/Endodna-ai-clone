/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Report_code_key" ON "Report"("code");
