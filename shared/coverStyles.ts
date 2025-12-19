export interface CoverStyle {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  imageUrl: string;
  category: 'floral' | 'nature' | 'classic' | 'modern';
}

export const coverStyles: CoverStyle[] = [
  {
    id: 'lavender',
    name: { en: 'Lavender Dreams', fr: 'Rêves de Lavande' },
    imageUrl: '/attached_assets/image_1766077316312.png',
    category: 'floral'
  },
  {
    id: 'rose',
    name: { en: 'Rose Garden', fr: 'Jardin de Roses' },
    imageUrl: '/attached_assets/image_1766077330393.png',
    category: 'floral'
  },
  {
    id: 'sage',
    name: { en: 'Sage Meadow', fr: 'Prairie de Sauge' },
    imageUrl: '/attached_assets/image_1766077341290.png',
    category: 'nature'
  },
  {
    id: 'peach',
    name: { en: 'Peach Blossom', fr: 'Fleur de Pêcher' },
    imageUrl: '/attached_assets/image_1766077354622.png',
    category: 'floral'
  },
  {
    id: 'ocean',
    name: { en: 'Ocean Breeze', fr: 'Brise Marine' },
    imageUrl: '/attached_assets/image_1766077368066.png',
    category: 'nature'
  },
  {
    id: 'sunset',
    name: { en: 'Sunset Glow', fr: 'Lueur du Couchant' },
    imageUrl: '/attached_assets/image_1766077379445.png',
    category: 'nature'
  },
  {
    id: 'mint',
    name: { en: 'Mint Fresh', fr: 'Menthe Fraîche' },
    imageUrl: '/attached_assets/image_1766077391628.png',
    category: 'nature'
  },
  {
    id: 'dusty-rose',
    name: { en: 'Dusty Rose', fr: 'Rose Poudré' },
    imageUrl: '/attached_assets/image_1766077402833.png',
    category: 'floral'
  },
  {
    id: 'sky-blue',
    name: { en: 'Sky Blue', fr: 'Bleu Ciel' },
    imageUrl: '/attached_assets/image_1766077414415.png',
    category: 'nature'
  },
  {
    id: 'cream',
    name: { en: 'Cream Classic', fr: 'Crème Classique' },
    imageUrl: '/attached_assets/image_1766077426906.png',
    category: 'classic'
  },
  {
    id: 'lilac',
    name: { en: 'Lilac Garden', fr: 'Jardin de Lilas' },
    imageUrl: '/attached_assets/image_1766077443190.png',
    category: 'floral'
  },
  {
    id: 'coral',
    name: { en: 'Coral Reef', fr: 'Récif Corallien' },
    imageUrl: '/attached_assets/image_1766077455027.png',
    category: 'nature'
  },
  {
    id: 'forest',
    name: { en: 'Forest Green', fr: 'Vert Forêt' },
    imageUrl: '/attached_assets/image_1766077466050.png',
    category: 'nature'
  },
  {
    id: 'blush',
    name: { en: 'Blush Pink', fr: 'Rose Blush' },
    imageUrl: '/attached_assets/image_1766077477143.png',
    category: 'floral'
  },
  {
    id: 'navy',
    name: { en: 'Navy Night', fr: 'Nuit Marine' },
    imageUrl: '/attached_assets/image_1766077488363.png',
    category: 'modern'
  },
  {
    id: 'terracotta',
    name: { en: 'Terracotta', fr: 'Terre Cuite' },
    imageUrl: '/attached_assets/image_1766077498476.png',
    category: 'classic'
  },
  {
    id: 'olive',
    name: { en: 'Olive Branch', fr: 'Branche d\'Olivier' },
    imageUrl: '/attached_assets/image_1766077509825.png',
    category: 'nature'
  },
  {
    id: 'mauve',
    name: { en: 'Mauve Dream', fr: 'Rêve Mauve' },
    imageUrl: '/attached_assets/image_1766077520008.png',
    category: 'floral'
  }
];

export function getCoverStyleById(id: string): CoverStyle | undefined {
  return coverStyles.find(style => style.id === id);
}

export function getCoverStylesByCategory(category: CoverStyle['category']): CoverStyle[] {
  return coverStyles.filter(style => style.category === category);
}
