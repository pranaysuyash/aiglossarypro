const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a simple SVG template function
function createIconSVG(iconPath, size = 512, bgColor = '#2563eb') {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="url(#gradient)" stroke="#1e40af" stroke-width="4"/>
  
  <!-- Icon content -->
  <g transform="translate(${size/2}, ${size/2})">
    ${iconPath}
  </g>
</svg>`.trim();
}

// Icon definitions using simple SVG paths (similar to react-icons)
const icons = {
  // Main app icon - AI/Brain symbol
  'main': `
    <g transform="translate(-48, -48)">
      <!-- AI Brain -->
      <path d="M48 24c-24 0-44 20-44 44 0 11 4 21 10 28-6 7-10 17-10 28 0 24 20 44 44 44s44-20 44-44c0-11-4-21-10-28 6-7 10-17 10-28 0-24-20-44-44-44z" fill="white" opacity="0.3"/>
      
      <!-- Circuit lines -->
      <line x1="20" y1="44" x2="35" y2="44" stroke="white" stroke-width="2" opacity="0.8"/>
      <line x1="61" y1="44" x2="76" y2="44" stroke="white" stroke-width="2" opacity="0.8"/>
      <line x1="20" y1="52" x2="35" y2="52" stroke="white" stroke-width="2" opacity="0.8"/>
      <line x1="61" y1="52" x2="76" y2="52" stroke="white" stroke-width="2" opacity="0.8"/>
      
      <!-- Circuit nodes -->
      <circle cx="30" cy="44" r="3" fill="white"/>
      <circle cx="66" cy="44" r="3" fill="white"/>
      <circle cx="30" cy="52" r="3" fill="white"/>
      <circle cx="66" cy="52" r="3" fill="white"/>
      
      <!-- Central AI text -->
      <text x="48" y="54" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">AI</text>
    </g>
  `,
  
  // Search icon
  'search': `
    <g transform="translate(-12, -12)" fill="white" stroke="white" stroke-width="2" stroke-linecap="round">
      <circle cx="11" cy="11" r="8" fill="none"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </g>
  `,
  
  // Learn/Education icon
  'learn': `
    <g transform="translate(-12, -12)" fill="white">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </g>
  `,
  
  // Heart/Favorites icon
  'heart': `
    <g transform="translate(-12, -12)" fill="white">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </g>
  `,
  
  // Offline/Download icon
  'offline': `
    <g transform="translate(-12, -12)" fill="white" stroke="white" stroke-width="2" stroke-linecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </g>
  `
};

// Sizes needed for the manifest
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const shortcutSize = 96;

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'client', 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  try {
    // Generate main app icons in different sizes
    for (const size of sizes) {
      const svg = createIconSVG(icons.main, size);
      const pngBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), pngBuffer);
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Generate shortcut icons
    const shortcuts = [
      { name: 'search', icon: icons.search },
      { name: 'learn', icon: icons.learn },
      { name: 'heart', icon: icons.heart },
      { name: 'offline', icon: icons.offline }
    ];

    for (const shortcut of shortcuts) {
      const svg = createIconSVG(shortcut.icon, shortcutSize);
      const pngBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(path.join(iconsDir, `${shortcut.name}-96x96.png`), pngBuffer);
      console.log(`Generated ${shortcut.name}-96x96.png`);
    }

    // Generate favicon.ico (32x32 and 16x16)
    const faviconSizes = [16, 32];
    for (const size of faviconSizes) {
      const svg = createIconSVG(icons.main, size);
      const pngBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      
      fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), pngBuffer);
      console.log(`Generated icon-${size}x${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('📍 Icons saved to: client/public/icons/');
    
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons(); 