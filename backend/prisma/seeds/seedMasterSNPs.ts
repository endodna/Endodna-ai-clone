import { PrismaClient } from "@prisma/client";
import { masterSNPs } from "./masterSNPs";

export async function seedMasterSNPs(prisma: PrismaClient) {
    console.log(`Starting to seed master SNPs...`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`Checking for existing master SNPs...`);
    let existingMasterSNPs;
    try {
        existingMasterSNPs = await prisma.masterSNP.findMany({
            select: {
                rsId: true,
            },
        });
    } catch (error) {
        console.error("Error fetching existing master SNPs:", error);
        throw error;
    }
    const existingRsIds = new Set(existingMasterSNPs.map((snp) => snp.rsId));
    console.log(`Found ${existingRsIds.size} existing master SNPs`);
    console.log(`Processing ${masterSNPs.length} master SNPs from seed data...`);

    const masterSNPsToCreate: typeof masterSNPs = [];

    for (const masterSNPData of masterSNPs) {
        try {
            if (existingRsIds.has(masterSNPData.rsId)) {
                skippedCount++;
                continue;
            }

            masterSNPsToCreate.push(masterSNPData);
        } catch (error) {
            console.error(`Error processing master SNP "${masterSNPData.rsId}":`, error);
            errorCount++;
        }
    }

    if (masterSNPsToCreate.length === 0) {
        console.log("\n=== Master SNPs Seeding Summary ===");
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total: ${masterSNPs.length}`);
        return;
    }

    console.log(`\nCreating ${masterSNPsToCreate.length} new master SNPs in transaction...`);

    try {
        await prisma.$transaction(
            async (tx) => {
                await tx.masterSNP.createMany({
                    data: masterSNPsToCreate.map((masterSNPData) => ({
                        rsId: masterSNPData.rsId,
                        geneName: masterSNPData.geneName,
                        geneSummary: masterSNPData.geneSummary,
                        chromosome: masterSNPData.chromosome,
                        position_GRCh38: masterSNPData.position_GRCh38,
                        referenceAllele: masterSNPData.referenceAllele,
                        altAllele: masterSNPData.altAllele,
                    })),
                });

                console.log(`Created ${masterSNPsToCreate.length} new master SNPs`);
                createdCount += masterSNPsToCreate.length;
            },
            {
                timeout: 60000,
            }
        );

        console.log("\n=== Master SNPs Seeding Summary ===");
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total: ${masterSNPs.length}`);
    } catch (error) {
        console.error("\nTransaction failed, all changes rolled back:", error);
        throw error;
    }
}

