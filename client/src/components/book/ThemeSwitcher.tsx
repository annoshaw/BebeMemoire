import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const THEMES = [
  {
    id: 'default',
    nameFr: 'Naturel',
    nameEn: 'Natural',
    primary: '#7d8e66',
    secondary: '#dc6b4a',
    background: '#fafaf9',
  },
  {
    id: 'pink',
    nameFr: 'Rose',
    nameEn: 'Pink',
    primary: '#ec4899',
    secondary: '#f472b6',
    background: '#fdf2f8',
  },
  {
    id: 'blue',
    nameFr: 'Océan',
    nameEn: 'Ocean',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: '#eff6ff',
  },
  {
    id: 'green',
    nameFr: 'Forêt',
    nameEn: 'Forest',
    primary: '#22c55e',
    secondary: '#4ade80',
    background: '#f0fdf4',
  },
  {
    id: 'sunset',
    nameFr: 'Coucher de soleil',
    nameEn: 'Sunset',
    primary: '#f97316',
    secondary: '#fb923c',
    background: '#fff7ed',
  },
];

export const COLOR_PRESETS = {
  neutral: {
    labelFr: 'Neutres',
    labelEn: 'Neutral',
    colors: [
      { color: '#FFFFFF', name: 'Blanc' },
      { color: '#F5F5DC', name: 'Beige' },
      { color: '#D2B48C', name: 'Tan' },
      { color: '#C4A484', name: 'Caramel' },
      { color: '#A0826D', name: 'Brun' },
      { color: '#8B7355', name: 'Café' },
      { color: '#E8DCCA', name: 'Crème' },
      { color: '#D4C4B0', name: 'Sable' },
    ],
  },
  pastel: {
    labelFr: 'Pastels',
    labelEn: 'Pastel',
    colors: [
      { color: '#F8BBD0', name: 'Rose' },
      { color: '#C8E6C9', name: 'Vert' },
      { color: '#BBDEFB', name: 'Bleu' },
      { color: '#FFF9C4', name: 'Jaune' },
      { color: '#FFE0B2', name: 'Pêche' },
      { color: '#E1BEE7', name: 'Lavande' },
      { color: '#B2DFDB', name: 'Menthe' },
      { color: '#F0E6FA', name: 'Lilas' },
    ],
  },
  vibrant: {
    labelFr: 'Vibrantes',
    labelEn: 'Vibrant',
    colors: [
      { color: '#FF6B6B', name: 'Rouge' },
      { color: '#4ECDC4', name: 'Turquoise' },
      { color: '#FFE66D', name: 'Soleil' },
      { color: '#95E1D3', name: 'Émeraude' },
      { color: '#F38181', name: 'Corail' },
      { color: '#AA96DA', name: 'Violet' },
      { color: '#6EB5FF', name: 'Ciel' },
      { color: '#FDCB6E', name: 'Or' },
    ],
  },
};

type ColorCategory = keyof typeof COLOR_PRESETS;

interface ThemeSwitcherProps {
  currentTheme?: string;
  onThemeChange: (themeId: string) => void;
  language?: 'fr' | 'en';
  className?: string;
}

export function ThemeSwitcher({
  currentTheme = 'default',
  onThemeChange,
  language = 'fr',
  className,
}: ThemeSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-2', className)}>
          <Palette className="w-4 h-4" />
          {language === 'fr' ? 'Thème' : 'Theme'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {language === 'fr' ? 'Choisir un thème' : 'Choose a theme'}
          </p>
          <div className="space-y-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                  currentTheme === theme.id
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded-full border border-stone-200"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-stone-200"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <span className="text-sm flex-1 text-left">
                  {language === 'fr' ? theme.nameFr : theme.nameEn}
                </span>
                {currentTheme === theme.id && (
                  <Check className="w-4 h-4 text-sage-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  language?: 'fr' | 'en';
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  language = 'fr',
  className,
}: ColorPickerProps) {
  const [category, setCategory] = useState<ColorCategory>('pastel');
  const currentCategory = COLOR_PRESETS[category];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1">
          <div
            className="w-4 h-4 rounded-full border border-stone-300"
            style={{ backgroundColor: value }}
          />
          <Palette className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-72 p-3 bg-white shadow-lg border border-stone-200',
          className
        )}
        align="end"
      >
        <div className="space-y-3">
          <p className="text-xs font-medium text-stone-600">
            {language === 'fr' ? 'Couleur de fond' : 'Background color'}
          </p>

          <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
            {(Object.keys(COLOR_PRESETS) as ColorCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all ${
                  category === cat
                    ? 'bg-white shadow-sm font-medium text-stone-800'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {language === 'fr'
                  ? COLOR_PRESETS[cat].labelFr
                  : COLOR_PRESETS[cat].labelEn}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {currentCategory.colors.map((preset) => (
              <button
                key={preset.color}
                onClick={() => onChange(preset.color)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  value === preset.color
                    ? 'border-sage-500 ring-2 ring-sage-200'
                    : 'border-stone-200 hover:border-stone-400'
                }`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              >
                {value === preset.color && (
                  <Check
                    className="w-4 h-4 mx-auto"
                    style={{
                      color:
                        preset.color === '#FFFFFF' ? '#374151' : '#FFFFFF',
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
