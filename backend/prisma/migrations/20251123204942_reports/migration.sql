/*
  Warnings:

  - The `genders` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "genders",
ADD COLUMN     "genders" "Gender"[];
