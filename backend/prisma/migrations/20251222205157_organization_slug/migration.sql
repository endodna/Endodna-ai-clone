/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;

UPDATE "Organization" 
SET "slug" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

UPDATE "Organization" o1
SET "slug" = o1."slug" || '-' || o1."id"::text
WHERE EXISTS (
  SELECT 1 FROM "Organization" o2 
  WHERE o2."slug" = o1."slug" 
  AND o2."id" < o1."id"
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");