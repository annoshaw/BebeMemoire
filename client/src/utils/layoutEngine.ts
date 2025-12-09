// Layout Engine for 8x11" Print Preview
// Based on professional print specifications

// Page dimensions in inches (converted to pixels for preview)
export const PAGE_SPEC = {
  // Full page size
  width: 8.5,    // inches
  height: 11,    // inches
  
  // Margins (safe zone)
  margin: 0.375, // 3/8 inch margin
  
  // Bleed for full-page images
  bleed: 0.125,  // 1/8 inch bleed
  
  // Active area (inside margins)
  activeWidth: 7.75,   // 8.5 - (0.375 * 2)
  activeHeight: 10.25, // 11 - (0.375 * 2)
  
  // Preview scale - adjusted to match 400px width in PageEditor
  previewScale: 400 / 8.5, // ~47 pixels per inch
};

// Calculate preview dimensions - matches PageEditor's 400x550 frame
export const PREVIEW_DIMS = {
  width: 400,  // Fixed to match PageEditor
  height: 550, // Fixed to match PageEditor
  margin: 16,  // Page padding
  activeWidth: 400 - 32,  // 368px usable width
  activeHeight: 550 - 32 - 24, // 494px usable height (minus header/footer)
};

// Zone definitions for the page
export interface PageZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Photo layout template
export interface PhotoLayout {
  id: string;
  name: string;
  nameEn: string;
  photoCount: number;
  zones: PageZone[];
  gap: number;
}

// Calculate zones based on the active area
const activeArea = {
  x: PREVIEW_DIMS.margin,
  y: PREVIEW_DIMS.margin,
  width: PREVIEW_DIMS.activeWidth,
  height: PREVIEW_DIMS.activeHeight,
};

// Header zone (title area) - top 8% of active area
export const HEADER_ZONE: PageZone = {
  x: activeArea.x,
  y: activeArea.y,
  width: activeArea.width,
  height: activeArea.height * 0.08,
};

// Image zone - 65% of active area (below header)
export const IMAGE_ZONE: PageZone = {
  x: activeArea.x,
  y: HEADER_ZONE.y + HEADER_ZONE.height + 4,
  width: activeArea.width,
  height: activeArea.height * 0.65,
};

// Text zone - 22% of active area (below images)
export const TEXT_ZONE: PageZone = {
  x: activeArea.x,
  y: IMAGE_ZONE.y + IMAGE_ZONE.height + 8,
  width: activeArea.width,
  height: activeArea.height * 0.22,
};

// Footer zone (page number) - 5% of active area
export const FOOTER_ZONE: PageZone = {
  x: activeArea.x,
  y: TEXT_ZONE.y + TEXT_ZONE.height + 4,
  width: activeArea.width,
  height: activeArea.height * 0.05,
};

// QR Code reserved zone (inside text zone, right side)
export const QR_ZONE: PageZone = {
  x: TEXT_ZONE.x + TEXT_ZONE.width - 80,
  y: TEXT_ZONE.y,
  width: 75,
  height: 90,
};

// Gap between elements
const GAP = 6;

// Photo layout templates
export const PHOTO_LAYOUTS: Record<number, PhotoLayout[]> = {
  // 1 photo layouts
  1: [
    {
      id: 'single_full',
      name: 'Pleine page',
      nameEn: 'Full page',
      photoCount: 1,
      gap: 0,
      zones: [{
        x: IMAGE_ZONE.x,
        y: IMAGE_ZONE.y,
        width: IMAGE_ZONE.width,
        height: IMAGE_ZONE.height,
      }],
    },
    {
      id: 'single_centered',
      name: 'Centrée avec marge',
      nameEn: 'Centered with margin',
      photoCount: 1,
      gap: 0,
      zones: [{
        x: IMAGE_ZONE.x + 20,
        y: IMAGE_ZONE.y + 10,
        width: IMAGE_ZONE.width - 40,
        height: IMAGE_ZONE.height - 20,
      }],
    },
  ],
  
  // 2 photos layouts
  2: [
    {
      id: 'two_horizontal',
      name: 'Côte à côte',
      nameEn: 'Side by side',
      photoCount: 2,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: IMAGE_ZONE.height,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP) / 2 + GAP,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: IMAGE_ZONE.height,
        },
      ],
    },
    {
      id: 'two_vertical',
      name: 'Empilées',
      nameEn: 'Stacked',
      photoCount: 2,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: IMAGE_ZONE.width,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
      ],
    },
    {
      id: 'two_large_small',
      name: 'Grande + petite',
      nameEn: 'Large + small',
      photoCount: 2,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width * 0.65,
          height: IMAGE_ZONE.height,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.65 + GAP,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.3,
          width: IMAGE_ZONE.width * 0.35 - GAP,
          height: IMAGE_ZONE.height * 0.7,
        },
      ],
    },
  ],
  
  // 3 photos layouts
  3: [
    {
      id: 'three_top_one',
      name: 'Une grande + deux petites',
      nameEn: 'One large + two small',
      photoCount: 3,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width,
          height: IMAGE_ZONE.height * 0.6,
        },
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.6 + GAP,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: IMAGE_ZONE.height * 0.4 - GAP,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP) / 2 + GAP,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.6 + GAP,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: IMAGE_ZONE.height * 0.4 - GAP,
        },
      ],
    },
    {
      id: 'three_row',
      name: 'Trois en ligne',
      nameEn: 'Three in a row',
      photoCount: 3,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.15,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: IMAGE_ZONE.height * 0.7,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP * 2) / 3 + GAP,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.15,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: IMAGE_ZONE.height * 0.7,
        },
        {
          x: IMAGE_ZONE.x + ((IMAGE_ZONE.width - GAP * 2) / 3 + GAP) * 2,
          y: IMAGE_ZONE.y + IMAGE_ZONE.height * 0.15,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: IMAGE_ZONE.height * 0.7,
        },
      ],
    },
    {
      id: 'three_mosaic',
      name: 'Mosaïque',
      nameEn: 'Mosaic',
      photoCount: 3,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width * 0.55,
          height: IMAGE_ZONE.height,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.55 + GAP,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width * 0.45 - GAP,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.55 + GAP,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: IMAGE_ZONE.width * 0.45 - GAP,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
      ],
    },
  ],
  
  // 4 photos layouts
  4: [
    {
      id: 'four_grid',
      name: 'Grille 2x2',
      nameEn: '2x2 Grid',
      photoCount: 4,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP) / 2 + GAP,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP) / 2 + GAP,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
      ],
    },
    {
      id: 'four_one_three',
      name: 'Une grande + trois petites',
      nameEn: 'One large + three small',
      photoCount: 4,
      gap: GAP,
      zones: [
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width * 0.6,
          height: IMAGE_ZONE.height,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.6 + GAP,
          y: IMAGE_ZONE.y,
          width: IMAGE_ZONE.width * 0.4 - GAP,
          height: (IMAGE_ZONE.height - GAP * 2) / 3,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.6 + GAP,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP * 2) / 3 + GAP,
          width: IMAGE_ZONE.width * 0.4 - GAP,
          height: (IMAGE_ZONE.height - GAP * 2) / 3,
        },
        {
          x: IMAGE_ZONE.x + IMAGE_ZONE.width * 0.6 + GAP,
          y: IMAGE_ZONE.y + ((IMAGE_ZONE.height - GAP * 2) / 3 + GAP) * 2,
          width: IMAGE_ZONE.width * 0.4 - GAP,
          height: (IMAGE_ZONE.height - GAP * 2) / 3,
        },
      ],
    },
  ],
  
  // 5+ photos - collage grid
  5: [
    {
      id: 'five_collage',
      name: 'Collage 5 photos',
      nameEn: '5 Photo Collage',
      photoCount: 5,
      gap: GAP,
      zones: [
        // Top row - 2 photos
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP) / 2 + GAP,
          y: IMAGE_ZONE.y,
          width: (IMAGE_ZONE.width - GAP) / 2,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        // Bottom row - 3 photos
        {
          x: IMAGE_ZONE.x,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + (IMAGE_ZONE.width - GAP * 2) / 3 + GAP,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
        {
          x: IMAGE_ZONE.x + ((IMAGE_ZONE.width - GAP * 2) / 3 + GAP) * 2,
          y: IMAGE_ZONE.y + (IMAGE_ZONE.height - GAP) / 2 + GAP,
          width: (IMAGE_ZONE.width - GAP * 2) / 3,
          height: (IMAGE_ZONE.height - GAP) / 2,
        },
      ],
    },
  ],
};

// Get the best layout for a given number of photos
export function getLayoutForPhotoCount(count: number, preferredLayoutId?: string): PhotoLayout {
  // Cap at 5 for predefined layouts
  const layoutCount = Math.min(count, 5);
  
  if (layoutCount === 0) {
    // Return a single full-page layout for text-only pages
    return PHOTO_LAYOUTS[1][0];
  }
  
  const layouts = PHOTO_LAYOUTS[layoutCount] || PHOTO_LAYOUTS[1];
  
  // If a preferred layout is specified, try to find it
  if (preferredLayoutId) {
    const preferred = layouts.find(l => l.id === preferredLayoutId);
    if (preferred) return preferred;
  }
  
  // Return the first (default) layout
  return layouts[0];
}

// Generate zones for more than 5 photos (dynamic grid)
export function generateCollageZones(photoCount: number): PageZone[] {
  if (photoCount <= 5) {
    return getLayoutForPhotoCount(photoCount).zones;
  }
  
  // Calculate optimal grid dimensions
  const cols = photoCount <= 6 ? 3 : photoCount <= 9 ? 3 : 4;
  const rows = Math.ceil(photoCount / cols);
  
  const cellWidth = (IMAGE_ZONE.width - GAP * (cols - 1)) / cols;
  const cellHeight = (IMAGE_ZONE.height - GAP * (rows - 1)) / rows;
  
  const zones: PageZone[] = [];
  
  for (let i = 0; i < photoCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    zones.push({
      x: IMAGE_ZONE.x + col * (cellWidth + GAP),
      y: IMAGE_ZONE.y + row * (cellHeight + GAP),
      width: cellWidth,
      height: cellHeight,
    });
  }
  
  return zones;
}

// Typography specifications
export const TYPOGRAPHY = {
  title: {
    fontFamily: "'Fraunces', serif",
    fontSize: 18,
    fontWeight: 600,
    color: '#4a5568',
    lineHeight: 1.3,
  },
  subtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 400,
    color: '#718096',
    lineHeight: 1.4,
  },
  body: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 10,
    fontWeight: 400,
    color: '#2d3748',
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 8,
    fontWeight: 400,
    color: '#a0aec0',
    lineHeight: 1.4,
  },
  pageNumber: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 9,
    fontWeight: 300,
    color: '#cbd5e0',
  },
};

// Color palettes
export const COLOR_PALETTES = {
  warm: {
    primary: '#c9a87c',    // Warm gold
    secondary: '#e8d5c4',  // Soft beige
    accent: '#9b7a5c',     // Terracotta
    background: '#fdfbf7', // Warm white
    text: '#3d3d3d',
  },
  cool: {
    primary: '#7c9cb4',    // Soft blue
    secondary: '#d4e5f7',  // Light blue
    accent: '#5a7a8c',     // Slate blue
    background: '#f7fafc', // Cool white
    text: '#2d3748',
  },
  sage: {
    primary: '#8fa88b',    // Sage green
    secondary: '#d4e4d0',  // Light sage
    accent: '#6b8e68',     // Deep sage
    background: '#f8faf7', // Warm white
    text: '#3d4a3c',
  },
  blush: {
    primary: '#d4a5a5',    // Blush pink
    secondary: '#f5e1e1',  // Light pink
    accent: '#b88c8c',     // Dusty rose
    background: '#fdf8f8', // Pink white
    text: '#4a3d3d',
  },
  neutral: {
    primary: '#a0a0a0',    // Gray
    secondary: '#e8e8e8',  // Light gray
    accent: '#707070',     // Dark gray
    background: '#fafafa', // Pure white
    text: '#333333',
  },
};

export type ColorPaletteName = keyof typeof COLOR_PALETTES;

// Get all available layouts for a photo count
export function getAvailableLayouts(photoCount: number): PhotoLayout[] {
  const count = Math.min(Math.max(photoCount, 1), 5);
  return PHOTO_LAYOUTS[count] || PHOTO_LAYOUTS[1];
}
