-- This is an empty migration.
UPDATE "PatientActiveMedication" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientActivity" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientAllergy" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientChartNote" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientDNAResultActivity" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientDNAResultBreakdown" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientDNAResultKit" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientDoctor" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientGoal" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientLabResult" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientMedicalRecord" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientMedicalRecordChunk" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientProblemList" SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE "PatientTreatmentPlan" SET uuid = gen_random_uuid() WHERE uuid IS NULL;