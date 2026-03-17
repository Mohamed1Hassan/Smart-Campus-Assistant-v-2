import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clean() {
  try {
    console.log("Cleaning conflicting student record...");
    const result = await prisma.user.deleteMany({
      where: {
        OR: [{ email: "student@smartcampus.edu" }, { universityId: "20221245" }],
      },
    });
    console.log(`Deleted ${result.count} conflicting record(s).`);
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
