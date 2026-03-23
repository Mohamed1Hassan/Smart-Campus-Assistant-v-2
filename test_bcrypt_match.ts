import bcrypt from "bcryptjs";

const hash = "$2b$10$tausMxUMtKa1jPMCVBbC9e0Y02.Y4xpZSin.xTkhKQxOv6FHk8D16";
const password = "student123";

async function testMatch() {
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`Testing password: ${password}`);
    console.log(`Testing hash: ${hash}`);
    console.log(`Result: ${isMatch}`);
}

testMatch();
