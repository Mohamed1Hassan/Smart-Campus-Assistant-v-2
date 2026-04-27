import prisma from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({ take: 3 });
  console.log("Users:", users.map(u => ({ id: u.id, role: u.role, name: u.name })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
