import { PrismaClient } from "@prisma/client";
import { seedReports } from "./seeds/seedReports";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...\n");

    try {
        await seedReports(prisma);
        console.log("\nDatabase seeding completed!");
    } catch (error) {
        console.error("Error during seeding:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error("Fatal error during seeding:", error);
        process.exit(1);
    });

