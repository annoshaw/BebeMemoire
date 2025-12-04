import ColorThief from 'colorthief';

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export async function extractDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const result = colorThief.getColor(img);
        resolve(rgbToHex(result[0], result[1], result[2]));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
  });
}

export async function extractPalette(imageSrc: string, colorCount: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, colorCount);
        const hexColors = palette.map((color: number[]) => 
          rgbToHex(color[0], color[1], color[2])
        );
        resolve(hexColors);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
  });
}

export function getLightestColor(colors: string[]): string {
  let lightest = colors[0];
  let maxBrightness = 0;
  
  for (const color of colors) {
    const rgb = hexToRgb(color);
    if (rgb) {
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      if (brightness > maxBrightness) {
        maxBrightness = brightness;
        lightest = color;
      }
    }
  }
  
  return lightest;
}

export function getDarkestColor(colors: string[]): string {
  let darkest = colors[0];
  let minBrightness = 255;
  
  for (const color of colors) {
    const rgb = hexToRgb(color);
    if (rgb) {
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      if (brightness < minBrightness) {
        minBrightness = brightness;
        darkest = color;
      }
    }
  }
  
  return darkest;
}

export function createHarmonicPalette(baseColor: string): string[] {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];
  
  const palette: string[] = [baseColor];
  
  const lighter = rgbToHex(
    Math.min(255, rgb.r + 60),
    Math.min(255, rgb.g + 60),
    Math.min(255, rgb.b + 60)
  );
  palette.push(lighter);
  
  const darker = rgbToHex(
    Math.max(0, rgb.r - 40),
    Math.max(0, rgb.g - 40),
    Math.max(0, rgb.b - 40)
  );
  palette.push(darker);
  
  const complement = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
  palette.push(complement);
  
  return palette;
}
