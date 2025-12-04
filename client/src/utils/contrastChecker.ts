export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAG(textColor: string, bgColor: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(textColor, bgColor);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

export function getBrightness(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 128;
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

export function getContrastColor(hexColor: string): string {
  const brightness = getBrightness(hexColor);
  return brightness > 125 ? '#374151' : '#FFFFFF';
}

export function getOptimalTextColor(bgColor: string): string {
  const blackRatio = getContrastRatio('#000000', bgColor);
  const whiteRatio = getContrastRatio('#FFFFFF', bgColor);
  
  if (whiteRatio > blackRatio && whiteRatio >= 4.5) {
    return '#FFFFFF';
  } else if (blackRatio >= 4.5) {
    return '#000000';
  }
  
  return whiteRatio > blackRatio ? '#FFFFFF' : '#374151';
}

export function suggestAccessibleColors(bgColor: string): {
  text: string;
  ratio: number;
  level: 'AAA' | 'AA' | 'Fail';
}[] {
  const candidates = ['#000000', '#FFFFFF', '#374151', '#1F2937', '#F9FAFB', '#111827'];
  
  return candidates.map(color => {
    const ratio = getContrastRatio(color, bgColor);
    let level: 'AAA' | 'AA' | 'Fail' = 'Fail';
    if (ratio >= 7) level = 'AAA';
    else if (ratio >= 4.5) level = 'AA';
    
    return { text: color, ratio: Math.round(ratio * 100) / 100, level };
  }).sort((a, b) => b.ratio - a.ratio);
}
