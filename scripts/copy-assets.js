import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\a945cff5-41e7-4968-aca3-632ad6863f56\\plan_tracker_logo_1784814179443.png';
const publicIconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create directory if it doesn't exist
if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

const dest512 = path.join(publicIconsDir, 'icon-512.png');
const dest192 = path.join(publicIconsDir, 'icon-192.png');

try {
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dest512);
    fs.copyFileSync(srcPath, dest192);
    console.log('✅ Successfully copied PWA PNG icons to public/icons/');
  } else {
    console.log(`⚠️ Source PNG file not found at ${srcPath}. SVG icon is still active as fallback.`);
  }
} catch (err) {
  console.error('❌ Error copying icons:', err.message);
}
