import { Prisma, PrismaClient } from "@prisma/client";
import { reports, organizationId } from "./reports";

function generateCodeFromTitle(title: string): string {
    return title
        .toUpperCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("_");
}

export async function seedReports(prisma: PrismaClient) {
    console.log(`Starting to seed reports for organization ${organizationId}...`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const reportsToCreate: typeof reports = [];

    for (const reportData of reports) {
        try {
            const reportName = reportData.name;

            const existingReport = await prisma.report.findFirst({
                where: {
                    title: reportName,
                    organizationId: organizationId,
                    deletedAt: null,
                },
            });

            if (existingReport) {
                console.log(`Report "${reportName}" already exists, skipping...`);
                skippedCount++;
                continue;
            }

            reportsToCreate.push(reportData);
        } catch (error) {
            console.error(`Error checking report "${reportData.name}":`, error);
            errorCount++;
        }
    }

    if (reportsToCreate.length === 0) {
        console.log("\n=== Reports Seeding Summary ===");
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total: ${reports.length}`);
        return;
    }

    console.log(`\nCreating ${reportsToCreate.length} new reports in transaction...`);

    try {
        await prisma.$transaction(
            async (tx) => {
                for (const reportData of reportsToCreate) {
                    const reportName = reportData.name;
                    const code = generateCodeFromTitle(reportName);

                    const report = await tx.report.create({
                        data: {
                            organizationId: organizationId,
                            code: code,
                            title: reportName,
                            description: null,
                            genders: reportData.genders,
                            price: new Prisma.Decimal(0),
                            metadata: Prisma.JsonNull,
                        },
                    });

                    const reportVersion = await tx.reportVersion.create({
                        data: {
                            reportId: report.id,
                            version: reportData.version,
                        },
                    });

                    for (const category of reportData.categories) {
                        const reportCategory = await tx.reportCategory.create({
                            data: {
                                name: category.category_name,
                                reportId: report.id,
                                reportVersionId: reportVersion.id
                            },
                        });

                        await tx.reportCategorySNP.createMany({
                            data: category.snps.map((snp) => ({
                                reportCategoryId: reportCategory.id,
                                rsID: snp.rsID,
                                pathogenicity: snp.pathogenicity,
                                genotype: snp.genotype,
                                sources: snp.sources,
                                description: snp.description,
                            })),
                        });
                    }

                    await tx.report.update({
                        where: {
                            id: report.id,
                        },
                        data: {
                            currentVersionId: reportVersion.id,
                        },
                    });

                    console.log(
                        `Created report "${reportName}" with ${reportData.categories.length} Categories (version ${reportData.version})`
                    );
                    createdCount++;
                }
            },
            {
                timeout: 60000,
            }
        );

        console.log("\n=== Seeding Summary ===");
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Total: ${reports.length}`);
    } catch (error) {
        console.error("\nTransaction failed, all changes rolled back:", error);
        throw error;
    }
}

