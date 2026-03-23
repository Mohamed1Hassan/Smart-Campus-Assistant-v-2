import prisma from "./src/lib/db";

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        universityId: true,
        email: true,
        role: true,
        name: true
      }
    });
    console.log("Current Users in DB:");
    console.table(users);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
