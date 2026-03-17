import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkAuth() {
  const universityId = "20221245";
  const passwordToTest = "student123";

  console.log(`Checking credentials for: ${universityId}`);

  try {
    const user = await prisma.user.findUnique({
      where: { universityId },
    });

    if (!user) {
      console.log("❌ User NOT found in the database. The seed might have failed or pointed somewhere else.");
      return;
    }

    console.log(`✅ User found: ${user.name} (Role: ${user.role})`);
    
    // Test the physical hash matching
    const isMatch = await bcrypt.compare(passwordToTest, user.password);
    
    if (isMatch) {
      console.log("✅ Password MATCHES! The database has the exact correct hash.");
      console.log("If login is failing on Vercel, there is a mismatch in the JWT_SECRET or how the Vercel API compares it.");
    } else {
      console.log("❌ Password does NOT match the hash in the database.");
    }
    
  } catch (error) {
    console.error("Error checking auth:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuth();
