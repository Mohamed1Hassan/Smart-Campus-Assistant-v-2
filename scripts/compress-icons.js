const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const icons = ['icon.png', 'apple-icon.png'];

async function compressIcons() {
  for (const icon of icons) {
    const filePath = path.join(publicDir, icon);
    if (fs.existsSync(filePath)) {
      console.log(`Compressing ${icon}...`);
      const buffer = await fs.promises.readFile(filePath);
      await sharp(buffer)
        .resize(192, 192) // Standard size for icons
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(path.join(publicDir, `compressed_${icon}`));
      
      // Replace original
      fs.renameSync(path.join(publicDir, `compressed_${icon}`), filePath);
      console.log(`Successfully compressed ${icon}`);
    }
  }
  
  // Handle favicon.ico (convert png to ico or just compress if it's actually a png renamed)
  const faviconPath = path.join(publicDir, 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    console.log(`Compressing favicon.ico...`);
    // Assuming it's a large PNG renamed to .ico based on the file size (708KB)
    const buffer = await fs.promises.readFile(faviconPath);
    await sharp(buffer)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'compressed_favicon.ico'));
    fs.renameSync(path.join(publicDir, 'compressed_favicon.ico'), faviconPath);
    console.log(`Successfully compressed favicon.ico`);
  }
}

compressIcons().catch(console.error);
