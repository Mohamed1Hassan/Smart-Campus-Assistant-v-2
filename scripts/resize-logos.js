const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const logos = ['logo-light.png', 'logo-dark.png', 'smart-campus-logo.png'];

async function resizeLogos() {
  for (const logo of logos) {
    const filePath = path.join(publicDir, logo);
    if (fs.existsSync(filePath)) {
      const backupPath = filePath + '.bak';
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath);
      }
      console.log(`Resizing ${logo}...`);
      try {
        await sharp(backupPath, { limitInputPixels: false })
          .resize(512) // Resize to 512px width
          .png({ quality: 80, compressionLevel: 9 })
          .toFile(filePath);
        console.log(`Successfully resized ${logo}`);
      } catch (err) {
        console.error(`Error resizing ${logo}:`, err);
      }
    } else {
      console.log(`File ${logo} not found at ${filePath}`);
    }
  }
}

resizeLogos();
