import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Image, 
  Video, 
  Plus, 
  X, 
  Camera, 
  Upload,
  Play,
  Trash2,
  Palette,
  Wand2,
  Check,
  Type,
  ALargeSmall,
  QrCode,
  Link
} from "lucide-react";
import ColorThief from "colorthief";
import { QRCodeSVG } from "qrcode.react";

// Font categories for text customization
const FONT_CATEGORIES = {
  tendance: {
    labelFr: "Tendance",
    labelEn: "Trendy",
    fonts: [
      { name: "Poppins", family: "'Poppins', sans-serif" },
      { name: "Raleway", family: "'Raleway', sans-serif" },
      { name: "Quicksand", family: "'Quicksand', sans-serif" },
    ]
  },
  classique: {
    labelFr: "Classique",
    labelEn: "Classic",
    fonts: [
      { name: "Georgia", family: "'Georgia', serif" },
      { name: "Times New Roman", family: "'Times New Roman', serif" },
      { name: "Playfair Display", family: "'Playfair Display', serif" },
    ]
  },
  feminin: {
    labelFr: "Féminin",
    labelEn: "Feminine",
    fonts: [
      { name: "Dancing Script", family: "'Dancing Script', cursive" },
      { name: "Great Vibes", family: "'Great Vibes', cursive" },
      { name: "Parisienne", family: "'Parisienne', cursive" },
    ]
  },
  masculin: {
    labelFr: "Masculin",
    labelEn: "Masculine",
    fonts: [
      { name: "Roboto", family: "'Roboto', sans-serif" },
      { name: "Oswald", family: "'Oswald', sans-serif" },
      { name: "Montserrat", family: "'Montserrat', sans-serif" },
    ]
  }
};

// Color categories for text box backgrounds
const COLOR_CATEGORIES = {
  neutral: {
    labelFr: "Neutres",
    labelEn: "Neutral",
    colors: [
      { color: "#FFFFFF", name: "Blanc" },
      { color: "#F5F5DC", name: "Beige" },
      { color: "#D2B48C", name: "Tan" },
      { color: "#C4A484", name: "Caramel" },
      { color: "#A0826D", name: "Brun" },
      { color: "#8B7355", name: "Café" },
      { color: "#E8DCCA", name: "Crème" },
      { color: "#D4C4B0", name: "Sable" },
    ]
  },
  pastel: {
    labelFr: "Pastels",
    labelEn: "Pastel",
    colors: [
      { color: "#F8BBD0", name: "Rose" },
      { color: "#C8E6C9", name: "Vert" },
      { color: "#BBDEFB", name: "Bleu" },
      { color: "#FFF9C4", name: "Jaune" },
      { color: "#FFE0B2", name: "Pêche" },
      { color: "#E1BEE7", name: "Lavande" },
      { color: "#B2DFDB", name: "Menthe" },
      { color: "#F0E6FA", name: "Lilas" },
    ]
  },
  vibrant: {
    labelFr: "Vibrantes",
    labelEn: "Vibrant",
    colors: [
      { color: "#FF6B6B", name: "Rouge" },
      { color: "#4ECDC4", name: "Turquoise" },
      { color: "#FFE66D", name: "Soleil" },
      { color: "#95E1D3", name: "Émeraude" },
      { color: "#F38181", name: "Corail" },
      { color: "#AA96DA", name: "Violet" },
      { color: "#6EB5FF", name: "Ciel" },
      { color: "#FDCB6E", name: "Or" },
    ]
  }
};

// Helper to determine text color based on background brightness
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 125 ? "#374151" : "#FFFFFF";
}

// Helper to convert RGB array to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

interface TextStyle {
  bgColor: string;
  textColor: string;
  fontFamily?: string;
  fontSize?: number; // in px
}

// Font size options
const FONT_SIZES = [
  { value: 12, label: "Petit" },
  { value: 14, label: "Normal" },
  { value: 16, label: "Moyen" },
  { value: 18, label: "Grand" },
  { value: 20, label: "Très grand" },
];

interface TextBlockProps {
  prompts: string[];
  values: string[];
  onChange: (index: number, value: string) => void;
  language: "fr" | "en";
  textStyles?: Record<number, TextStyle>;
  onStyleChange?: (index: number, style: TextStyle) => void;
  photos?: string[];
  separateFields?: boolean; // Keep separate text areas for each prompt (e.g., page 20)
  onApplyStyleToAll?: () => void; // Apply style to all pages
  applyingStyle?: boolean;
}

export function TextBlock({ 
  prompts, 
  values, 
  onChange, 
  language,
  textStyles = {},
  onStyleChange,
  photos = [],
  separateFields = false,
  onApplyStyleToAll,
  applyingStyle = false
}: TextBlockProps) {
  const [extractingColor, setExtractingColor] = useState<number | null>(null);

  const getStyle = (index: number): TextStyle => {
    return textStyles[index] || { bgColor: "#FFFFFF", textColor: "#374151", fontFamily: "'Poppins', sans-serif", fontSize: 14 };
  };

  const setFontSize = (index: number, fontSize: number) => {
    if (!onStyleChange) return;
    const currentStyle = getStyle(index);
    onStyleChange(index, { ...currentStyle, fontSize });
  };

  const extractColorFromPhoto = async (photoSrc: string, index: number) => {
    if (!onStyleChange) return;
    
    setExtractingColor(index);
    
    try {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = photoSrc;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const colorThief = new ColorThief();
      const result = colorThief.getColor(img);
      const bgColor = rgbToHex(result[0], result[1], result[2]);
      const textColor = getContrastColor(bgColor);
      const currentStyle = getStyle(index);
      
      onStyleChange(index, { ...currentStyle, bgColor, textColor });
    } catch (error) {
      console.error("Error extracting color:", error);
    } finally {
      setExtractingColor(null);
    }
  };

  const setPresetColor = (index: number, color: string) => {
    if (!onStyleChange) return;
    const currentStyle = getStyle(index);
    onStyleChange(index, { ...currentStyle, bgColor: color, textColor: getContrastColor(color) });
  };

  const setFont = (index: number, fontFamily: string) => {
    if (!onStyleChange) return;
    const currentStyle = getStyle(index);
    onStyleChange(index, { ...currentStyle, fontFamily });
  };

  const [colorCategory, setColorCategory] = useState<"neutral" | "pastel" | "vibrant">("pastel");
  const [fontCategory, setFontCategory] = useState<"tendance" | "classique" | "feminin" | "masculin">("tendance");

  const renderStylePickers = (index: number) => {
    const style = getStyle(index);
    const currentColorCategory = COLOR_CATEGORIES[colorCategory];
    const currentFontCategory = FONT_CATEGORIES[fontCategory];
    
    return (
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {/* Font Picker */}
        {onStyleChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 shrink-0">
                <Type className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-white shadow-lg border border-stone-200" align="end">
              <div className="space-y-3">
                <p className="text-xs font-medium text-stone-600">
                  {language === "fr" ? "Police de caractères" : "Font"}
                </p>
                
                {/* Font category tabs */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-lg">
                  {(Object.keys(FONT_CATEGORIES) as Array<keyof typeof FONT_CATEGORIES>).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFontCategory(cat)}
                      className={`text-xs py-1.5 px-2 rounded-md transition-all ${
                        fontCategory === cat
                          ? "bg-white shadow-sm font-medium text-stone-800"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      {language === "fr" ? FONT_CATEGORIES[cat].labelFr : FONT_CATEGORIES[cat].labelEn}
                    </button>
                  ))}
                </div>
                
                {/* Font options */}
                <div className="space-y-1">
                  {currentFontCategory.fonts.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setFont(index, font.family)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                        style.fontFamily === font.family
                          ? "border-sage-500 bg-sage-50"
                          : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      <span className="text-sm">{font.name}</span>
                      <span className="block text-xs text-stone-400 mt-0.5" style={{ fontFamily: font.family }}>
                        Aa Bb Cc 123
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Font Size Picker */}
        {onStyleChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0 shrink-0">
                <ALargeSmall className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 bg-white shadow-lg border border-stone-200" align="end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-stone-600">
                  {language === "fr" ? "Taille du texte" : "Text size"}
                </p>
                <div className="space-y-1">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setFontSize(index, size.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                        (style.fontSize || 14) === size.value
                          ? "border-sage-500 bg-sage-50"
                          : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
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
        )}

        {/* Color Picker */}
        {onStyleChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-auto sm:gap-1 p-0 sm:px-2 shrink-0">
                <div 
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-stone-300"
                  style={{ backgroundColor: style.bgColor }}
                />
                <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden sm:block" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 bg-white shadow-lg border border-stone-200" align="end">
              <div className="space-y-3">
                <p className="text-xs font-medium text-stone-600">
                  {language === "fr" ? "Couleur de fond" : "Background color"}
                </p>
                
                {/* Category tabs */}
                <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
                  {(Object.keys(COLOR_CATEGORIES) as Array<keyof typeof COLOR_CATEGORIES>).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setColorCategory(cat)}
                      className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-all ${
                        colorCategory === cat
                          ? "bg-white shadow-sm font-medium text-stone-800"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      {language === "fr" ? COLOR_CATEGORIES[cat].labelFr : COLOR_CATEGORIES[cat].labelEn}
                    </button>
                  ))}
                </div>
                
                {/* Color grid */}
                <div className="grid grid-cols-4 gap-2">
                  {currentColorCategory.colors.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => setPresetColor(index, preset.color)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        style.bgColor === preset.color 
                          ? "border-sage-500 ring-2 ring-sage-200" 
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {style.bgColor === preset.color && (
                        <Check className="w-4 h-4 mx-auto" style={{ color: getContrastColor(preset.color) }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Extract from photos */}
                {photos.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
                      <Wand2 className="w-3 h-3" />
                      {language === "fr" 
                        ? "Extraire d'une photo" 
                        : "Extract from a photo"}
                    </p>
                    <div className="grid grid-cols-4 gap-1">
                      {photos.slice(0, 4).map((photo, photoIdx) => (
                        <button
                          key={photoIdx}
                          onClick={() => extractColorFromPhoto(photo, index)}
                          disabled={extractingColor !== null}
                          className="aspect-square rounded overflow-hidden border border-stone-200 hover:border-sage-400 transition-colors disabled:opacity-50"
                        >
                          <img 
                            src={photo} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {/* Apply to all button */}
        {onApplyStyleToAll && index === 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 sm:h-7 text-[9px] sm:text-xs px-1.5 sm:px-2 whitespace-nowrap"
            onClick={onApplyStyleToAll}
            disabled={applyingStyle}
          >
            <span className="hidden sm:inline">{language === "fr" ? "Appliquer à tous" : "Apply to all"}</span>
            <span className="sm:hidden">{language === "fr" ? "Tous" : "All"}</span>
          </Button>
        )}
      </div>
    );
  };

  // Mode with separate fields for each prompt (e.g., page 20 - name choice)
  if (separateFields) {
    return (
      <div className="space-y-4">
        {prompts.map((prompt, index) => {
          const style = getStyle(index);
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 flex-nowrap">
                <Label className="text-xs sm:text-sm text-sage-700 font-medium flex-1 min-w-0 truncate sm:whitespace-normal">{prompt}</Label>
                {renderStylePickers(index)}
              </div>
              <Textarea
                data-testid={`text-block-${index}`}
                value={values[index] || ""}
                onChange={(e) => onChange(index, e.target.value)}
                placeholder={language === "fr" ? "Écrivez ici..." : "Write here..."}
                className="min-h-[80px] resize-y border-sage-200 focus:border-sage-400 transition-colors"
                style={{ 
                  backgroundColor: style.bgColor, 
                  color: style.textColor,
                  fontFamily: style.fontFamily,
                  fontSize: `${style.fontSize || 14}px`,
                  borderColor: style.bgColor === "#FFFFFF" ? undefined : style.bgColor
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Default mode: combine all prompts into a single phrase with one text area
  const combinedPrompt = prompts.length > 1 
    ? prompts.join(" • ")
    : prompts[0] || "";

  const style = getStyle(0);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Label className="text-[10px] sm:text-sm text-sage-700 font-medium leading-tight flex-1 min-w-0 line-clamp-2">
          {combinedPrompt}
        </Label>
        <div className="flex-shrink-0">
          {renderStylePickers(0)}
        </div>
      </div>
      
      <Textarea
        data-testid="text-block-0"
        value={values[0] || ""}
        onChange={(e) => onChange(0, e.target.value)}
        placeholder={language === "fr" ? "Écrivez ici..." : "Write here..."}
        className="min-h-[120px] resize-y border-sage-200 focus:border-sage-400 transition-colors"
        style={{ 
          backgroundColor: style.bgColor, 
          color: style.textColor,
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize || 14}px`,
          borderColor: style.bgColor === "#FFFFFF" ? undefined : style.bgColor
        }}
      />
    </div>
  );
}

interface PhotoBlockProps {
  photos: string[];
  maxPhotos: number;
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  language: "fr" | "en";
}

export function PhotoBlock({ photos, maxPhotos, onAdd, onRemove, language }: PhotoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onAdd(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onAdd(file);
    }
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-sage-700">
          {language === "fr" ? "Photos" : "Photos"} ({photos.length}/{maxPhotos})
        </Label>
      </div>

      <div className={`grid gap-4 ${
        maxPhotos === 1 ? 'grid-cols-1' :
        maxPhotos <= 4 ? 'grid-cols-2' :
        maxPhotos <= 9 ? 'grid-cols-3' :
        'grid-cols-4'
      }`}>
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-lg overflow-hidden border border-sage-200 group"
          >
            <img 
              src={photo} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`remove-photo-${index}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <div
            className={`aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer ${
              dragOver 
                ? "border-sage-500 bg-sage-50" 
                : "border-sage-300 hover:border-sage-400 hover:bg-sage-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            data-testid="add-photo-button"
          >
            <Camera className="w-8 h-8 text-sage-400 mb-2" />
            <span className="text-sm text-sage-500">
              {language === "fr" ? "Ajouter" : "Add"}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

interface VideoBlockProps {
  videoUrl: string | null;
  onAdd: (file: File) => void;
  onRemove: () => void;
  language: "fr" | "en";
  qrCodeUrl?: string;
  isUploading?: boolean;
}

export function VideoBlock({ videoUrl, onAdd, onRemove, language, qrCodeUrl, isUploading }: VideoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onAdd(file);
    }
  };

  const isS3Url = videoUrl && (videoUrl.startsWith('https://') || videoUrl.startsWith('http://'));
  const isLocalVideo = videoUrl && videoUrl.startsWith('data:');

  return (
    <div className="space-y-4">
      <Label className="text-sm text-sage-700 flex items-center gap-2">
        <Video className="w-4 h-4" />
        {language === "fr" ? "Vidéo" : "Video"}
      </Label>

      {isUploading && (
        <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-sage-600">
              {language === "fr" ? "Téléversement en cours..." : "Uploading..."}
            </span>
          </div>
        </div>
      )}

      {videoUrl && !isUploading ? (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-sage-200">
            {isS3Url ? (
              <video 
                src={videoUrl} 
                controls 
                className="w-full aspect-video object-cover"
              />
            ) : (
              <video 
                src={videoUrl} 
                controls 
                className="w-full aspect-video object-cover"
              />
            )}
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
              data-testid="remove-video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* QR Code for print version */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                {isS3Url ? (
                  <QRCodeSVG 
                    value={qrCodeUrl || videoUrl} 
                    size={100}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-24 h-24 bg-purple-100 rounded flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-8 h-8 text-purple-400 mx-auto mb-1" />
                      <span className="text-[9px] text-purple-500">
                        {language === "fr" ? "En attente" : "Pending"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-1">
                  <QrCode className="w-4 h-4" />
                  {language === "fr" ? "Code QR pour le livre imprimé" : "QR Code for printed book"}
                </div>
                <p className="text-xs text-purple-600">
                  {isS3Url
                    ? (language === "fr" 
                        ? "Ce code QR apparaîtra dans votre livre imprimé. Scannez-le pour voir la vidéo."
                        : "This QR code will appear in your printed book. Scan it to watch the video.")
                    : (language === "fr" 
                        ? "Le code QR sera généré après le téléversement de la vidéo."
                        : "QR code will be generated after video upload.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : !isUploading && (
        <div
          className="aspect-video rounded-lg border-2 border-dashed border-sage-300 hover:border-sage-400 hover:bg-sage-50 transition-colors flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          data-testid="add-video-button"
        >
          <Video className="w-10 h-10 text-sage-400 mb-2" />
          <span className="text-sm text-sage-500">
            {language === "fr" ? "Ajouter une vidéo" : "Add a video"}
          </span>
          <span className="text-xs text-sage-400 mt-1">
            {language === "fr" ? "Un code QR sera généré automatiquement" : "A QR code will be generated automatically"}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

interface BirthInfoBlockProps {
  data: {
    fullName?: string;
    date?: string;
    time?: string;
    weight?: string;
    height?: string;
    place?: string;
    apgarScore?: string;
  };
  onChange: (field: string, value: string) => void;
  language: "fr" | "en";
}

export function BirthInfoBlock({ data, onChange, language }: BirthInfoBlockProps) {
  const fields = [
    { key: "fullName", labelFr: "Nom complet", labelEn: "Full Name" },
    { key: "date", labelFr: "Date de naissance", labelEn: "Date of Birth", type: "date" },
    { key: "time", labelFr: "Heure de naissance", labelEn: "Time of Birth", type: "time" },
    { key: "weight", labelFr: "Poids", labelEn: "Weight", placeholder: "3.5 kg" },
    { key: "height", labelFr: "Taille", labelEn: "Height", placeholder: "50 cm" },
    { key: "place", labelFr: "Lieu de naissance", labelEn: "Place of Birth" },
    { key: "apgarScore", labelFr: "Score APGAR", labelEn: "APGAR Score", placeholder: "9/10" },
  ];

  return (
    <Card className="border-sage-200 bg-cream-50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm text-sage-700">
                {language === "fr" ? field.labelFr : field.labelEn}
              </Label>
              <Input
                type={field.type || "text"}
                value={(data as any)[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="border-sage-200 focus:border-sage-400"
                data-testid={`birth-info-${field.key}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface CollageBlockProps {
  photos: string[];
  maxPhotos: number;
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  language: "fr" | "en";
}

export function CollageBlock({ photos, maxPhotos, onAdd, onRemove, language }: CollageBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/") && photos.length < maxPhotos) {
          onAdd(file);
        }
      });
    }
  };

  const getGridClass = () => {
    if (photos.length === 0) return "grid-cols-1";
    if (photos.length === 1) return "grid-cols-1";
    if (photos.length === 2) return "grid-cols-2";
    if (photos.length <= 4) return "grid-cols-2";
    if (photos.length <= 6) return "grid-cols-3";
    if (photos.length <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-sage-700">
          {language === "fr" ? "Collage photos" : "Photo Collage"} ({photos.length}/{maxPhotos})
        </Label>
        {photos.length < maxPhotos && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="add-collage-photos"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === "fr" ? "Ajouter" : "Add"}
          </Button>
        )}
      </div>

      <div className={`grid ${getGridClass()} gap-2`}>
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-lg overflow-hidden border border-sage-200 group"
          >
            <img 
              src={photo} 
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`remove-collage-photo-${index}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length === 0 && (
          <div
            className="aspect-video col-span-full rounded-lg border-2 border-dashed border-sage-300 hover:border-sage-400 hover:bg-sage-50 transition-colors flex flex-col items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-12 h-12 text-sage-400 mb-3" />
            <span className="text-sm text-sage-500">
              {language === "fr" 
                ? `Ajoutez jusqu'à ${maxPhotos} photos` 
                : `Add up to ${maxPhotos} photos`}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

interface MessageBlockProps {
  message: string;
  onChange: (value: string) => void;
  language: "fr" | "en";
}

export function MessageBlock({ message, onChange, language }: MessageBlockProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm text-sage-700 font-medium">
        {language === "fr" 
          ? "Message pour votre enfant" 
          : "Message for your child"}
      </Label>
      <Textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder={language === "fr" 
          ? "Cher(e) ... , nous voulons te dire combien nous t'aimons..."
          : "Dear ... , we want to tell you how much we love you..."}
        className="min-h-[200px] resize-y border-sage-200 focus:border-sage-400 font-serif text-lg leading-relaxed"
        data-testid="message-block"
      />
    </div>
  );
}
