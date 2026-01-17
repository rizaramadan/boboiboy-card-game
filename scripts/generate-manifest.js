import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../public/assets');
const supportedFormats = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

function getAssetFiles(dir) {
  return fs.readdirSync(dir)
    .filter(file => supportedFormats.some(ext => file.endsWith(ext)))
    .map(file => {
      const ext = supportedFormats.find(e => file.endsWith(e));
      return {
        key: file.replace(ext, ''),
        file: file
      };
    });
}

// Generate monsters manifest
const monstersDir = path.join(assetsDir, 'monsters');
const monsters = getAssetFiles(monstersDir);

// Generate hero manifest
const heroDir = path.join(assetsDir, 'hero');
const heroes = getAssetFiles(heroDir);

// Generate UI manifest
const uiDir = path.join(assetsDir, 'ui');
const ui = getAssetFiles(uiDir);

const manifest = {
  heroes,
  monsters,
  ui
};

const manifestPath = path.join(assetsDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✓ Generated asset manifest:');
console.log(`  Heroes: ${heroes.length} (${heroes.map(h => h.key).join(', ')})`);
console.log(`  Monsters: ${monsters.length} (${monsters.map(m => m.key).join(', ')})`);
console.log(`  UI: ${ui.length} (${ui.map(u => u.key).join(', ')})`);
