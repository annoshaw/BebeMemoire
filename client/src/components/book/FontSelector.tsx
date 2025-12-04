import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Type, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FONT_CATEGORIES = {
  tendance: {
    labelFr: 'Tendance',
    labelEn: 'Trendy',
    fonts: [
      { name: 'Poppins', family: "'Poppins', sans-serif" },
      { name: 'Raleway', family: "'Raleway', sans-serif" },
      { name: 'Quicksand', family: "'Quicksand', sans-serif" },
    ],
  },
  classique: {
    labelFr: 'Classique',
    labelEn: 'Classic',
    fonts: [
      { name: 'Georgia', family: "'Georgia', serif" },
      { name: 'Times New Roman', family: "'Times New Roman', serif" },
      { name: 'Playfair Display', family: "'Playfair Display', serif" },
    ],
  },
  feminin: {
    labelFr: 'Féminin',
    labelEn: 'Feminine',
    fonts: [
      { name: 'Dancing Script', family: "'Dancing Script', cursive" },
      { name: 'Great Vibes', family: "'Great Vibes', cursive" },
      { name: 'Parisienne', family: "'Parisienne', cursive" },
    ],
  },
  masculin: {
    labelFr: 'Masculin',
    labelEn: 'Masculine',
    fonts: [
      { name: 'Roboto', family: "'Roboto', sans-serif" },
      { name: 'Oswald', family: "'Oswald', sans-serif" },
      { name: 'Montserrat', family: "'Montserrat', sans-serif" },
    ],
  },
};

export type FontCategory = keyof typeof FONT_CATEGORIES;

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  language?: 'fr' | 'en';
  className?: string;
  triggerClassName?: string;
  showLabel?: boolean;
}

export function FontSelector({
  value,
  onChange,
  language = 'fr',
  className,
  triggerClassName,
  showLabel = false,
}: FontSelectorProps) {
  const [category, setCategory] = useState<FontCategory>('tendance');
  const currentCategory = FONT_CATEGORIES[category];

  const getCurrentFontName = () => {
    for (const cat of Object.values(FONT_CATEGORIES)) {
      const font = cat.fonts.find((f) => f.family === value);
      if (font) return font.name;
    }
    return 'Poppins';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-7 gap-1', triggerClassName)}
        >
          <Type className="w-3.5 h-3.5" />
          {showLabel && (
            <span className="text-xs" style={{ fontFamily: value }}>
              {getCurrentFontName()}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-64 p-3 bg-white shadow-lg border border-stone-200',
          className
        )}
        align="end"
      >
        <div className="space-y-3">
          <p className="text-xs font-medium text-stone-600">
            {language === 'fr' ? 'Police de caractères' : 'Font'}
          </p>

          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-lg">
            {(Object.keys(FONT_CATEGORIES) as FontCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs py-1.5 px-2 rounded-md transition-all ${
                  category === cat
                    ? 'bg-white shadow-sm font-medium text-stone-800'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {language === 'fr'
                  ? FONT_CATEGORIES[cat].labelFr
                  : FONT_CATEGORIES[cat].labelEn}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {currentCategory.fonts.map((font) => (
              <button
                key={font.name}
                onClick={() => onChange(font.family)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                  value === font.family
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                }`}
                style={{ fontFamily: font.family }}
              >
                <span className="text-sm">{font.name}</span>
                <span
                  className="block text-xs text-stone-400 mt-0.5"
                  style={{ fontFamily: font.family }}
                >
                  Aa Bb Cc 123
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FontSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
  sizes?: { value: number; label: string }[];
  language?: 'fr' | 'en';
  className?: string;
}

const DEFAULT_SIZES = [
  { value: 12, label: 'Petit' },
  { value: 14, label: 'Normal' },
  { value: 16, label: 'Moyen' },
  { value: 18, label: 'Grand' },
  { value: 20, label: 'Très grand' },
];

export function FontSizeSelector({
  value,
  onChange,
  sizes = DEFAULT_SIZES,
  language = 'fr',
  className,
}: FontSizeSelectorProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1">
          <span className="text-xs">{value}px</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-48 p-3 bg-white shadow-lg border border-stone-200',
          className
        )}
        align="end"
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-600">
            {language === 'fr' ? 'Taille du texte' : 'Text size'}
          </p>
          <div className="space-y-1">
            {sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => onChange(size.value)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                  value === size.value
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                <span style={{ fontSize: `${size.value}px` }}>{size.label}</span>
                <span className="text-xs text-stone-400">{size.value}px</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
