import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple game-themed icon using SVG
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d2d44;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a90e2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2d5f9e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bgGradient)"/>

  <!-- Card shape -->
  <rect x="${size * 0.2}" y="${size * 0.15}"
        width="${size * 0.6}" height="${size * 0.7}"
        rx="${size * 0.05}"
        fill="url(#cardGradient)"
        stroke="#fff"
        stroke-width="${size * 0.02}"/>

  <!-- Heart icon (health) -->
  <path d="M ${size * 0.35} ${size * 0.3}
           C ${size * 0.35} ${size * 0.25}, ${size * 0.3} ${size * 0.22}, ${size * 0.27} ${size * 0.25}
           C ${size * 0.24} ${size * 0.28}, ${size * 0.24} ${size * 0.32}, ${size * 0.27} ${size * 0.35}
           L ${size * 0.35} ${size * 0.42}
           L ${size * 0.43} ${size * 0.35}
           C ${size * 0.46} ${size * 0.32}, ${size * 0.46} ${size * 0.28}, ${size * 0.43} ${size * 0.25}
           C ${size * 0.4} ${size * 0.22}, ${size * 0.35} ${size * 0.25}, ${size * 0.35} ${size * 0.3} Z"
        fill="#ff6b6b"/>

  <!-- Sword icon (attack) -->
  <g transform="rotate(-45 ${size * 0.65} ${size * 0.4})">
    <rect x="${size * 0.63}" y="${size * 0.3}"
          width="${size * 0.04}" height="${size * 0.15}"
          fill="#ffd93d"/>
    <polygon points="${size * 0.65},${size * 0.28} ${size * 0.62},${size * 0.32} ${size * 0.68},${size * 0.32}"
             fill="#ffed4e"/>
  </g>

  <!-- Game title text -->
  <text x="${size * 0.5}" y="${size * 0.65}"
        font-family="Arial, sans-serif"
        font-size="${size * 0.08}"
        font-weight="bold"
        fill="#fff"
        text-anchor="middle">BB</text>
</svg>
`;

// For Node.js, we'll create placeholder PNG files
// In a real scenario, you'd use a library like 'sharp' or 'canvas' to convert SVG to PNG
// For now, we'll just save the SVG files and create a note
console.log('Generating app icons...');

sizes.forEach(size => {
  const svg = createIconSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Created ${size}x${size} icon (SVG)`);
});

// Create a README to explain how to convert to PNG
const readme = `# App Icons

SVG icons have been generated. To convert them to PNG:

## Option 1: Online Converter
1. Visit https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Download the PNG files

## Option 2: Using ImageMagick (if installed)
\`\`\`bash
for file in *.svg; do
  convert "$file" "\${file%.svg}.png"
done
\`\`\`

## Option 3: Using Browser
The service worker will serve the SVG files, which work fine for PWAs.
Modern browsers support SVG icons in web app manifests.
`;

fs.writeFileSync(path.join(iconsDir, 'README.md'), readme);

console.log('\n✓ Icon generation complete!');
console.log('  SVG icons created in public/icons/');
console.log('  These will work for PWA installation.');
console.log('  See public/icons/README.md for PNG conversion options.');
