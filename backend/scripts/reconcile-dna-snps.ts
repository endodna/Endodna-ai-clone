import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import dnaSNPsProcessorService from "../src/services/cron/dnaSNPsProcessor.service";
import { generateTraceId } from "../src/helpers/misc.helper";

async function main() {
    const traceId = generateTraceId();

    console.log("Starting DNA SNPs reconciliation...");
    console.log(`Trace ID: ${traceId}`);

    try {
        await dnaSNPsProcessorService.reconcileAllProcessedDNAFiles(traceId);
        console.log("\nDNA SNPs reconciliation completed successfully!");
    } catch (error) {
        console.error("\nDNA SNPs reconciliation failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });

