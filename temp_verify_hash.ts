import prisma from "./src/lib/db";
import { EncryptionUtils } from "./src/utils/encryption";

async function verifyUserHash() {
  const universityId = "20221245";
  try {
    const user = await prisma.user.findUnique({
      where: { universityId }
    });
    
    if (!user) {
      console.log(`User ${universityId} not found.`);
      return;
    }
    
    console.log(`User found: ${user.name} (${user.universityId})`);
    console.log(`Hash: ${user.password}`);
    
    const isValidHash = EncryptionUtils.isValidHash(user.password);
    console.log(`Is valid bcrypt hash: ${isValidHash}`);
    
    if (isValidHash) {
        const rounds = EncryptionUtils.getRoundsFromHash(user.password);
        console.log(`Bcrypt rounds: ${rounds}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserHash();
