-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'LICENSEE';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isLicensee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentOrganizationId" INTEGER;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
