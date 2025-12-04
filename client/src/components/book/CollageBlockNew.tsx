import { useRef, useState } from "react";
import { Camera, X, Grid3X3, LayoutGrid, Layers, GalleryHorizontal, Image, BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./CollageBlock.css";

export type CollageStyle = "grid" | "featured" | "mosaic" | "strips" | "polaroid" | "scrapbook";

interface CollageBlockNewProps {
  photos: string[];
  maxPhotos?: number;
  onAdd?: (file: File) => void;
  onRemove?: (index: number) => void;
  language?: "fr" | "en";
  editable?: boolean;
  style?: CollageStyle;
  onStyleChange?: (style: CollageStyle) => void;
}

const STYLES: { id: CollageStyle; labelFr: string; labelEn: string; icon: React.ReactNode }[] = [
  { id: "grid", labelFr: "Grille", labelEn: "Grid", icon: <Grid3X3 className="w-4 h-4" /> },
  { id: "featured", labelFr: "Photo vedette", labelEn: "Featured", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "mosaic", labelFr: "Mosaïque", labelEn: "Mosaic", icon: <Layers className="w-4 h-4" /> },
  { id: "strips", labelFr: "Bandes", labelEn: "Strips", icon: <GalleryHorizontal className="w-4 h-4" /> },
  { id: "polaroid", labelFr: "Polaroid", labelEn: "Polaroid", icon: <Image className="w-4 h-4" /> },
  { id: "scrapbook", labelFr: "Album créatif", labelEn: "Scrapbook", icon: <BookOpen className="w-4 h-4" /> },
];

const getGridClass = (count: number): string => {
  if (count <= 0) return "grid-1";
  if (count === 1) return "grid-1";
  if (count === 2) return "grid-2";
  if (count === 3) return "grid-3";
  if (count === 4) return "grid-4";
  if (count === 5) return "grid-5";
  if (count === 6) return "grid-6";
  if (count === 7) return "grid-7";
  if (count === 8) return "grid-8";
  if (count === 9) return "grid-9";
  if (count === 10) return "grid-10";
  if (count === 11) return "grid-11";
  if (count === 12) return "grid-12";
  if (count === 13) return "grid-13";
  if (count === 14) return "grid-14";
  return "grid-15";
};

export function CollageBlockNew({
  photos,
  maxPhotos = 15,
  onAdd,
  onRemove,
  language = "fr",
  editable = true,
  style = "grid",
  onStyleChange,
}: CollageBlockNewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localStyle, setLocalStyle] = useState<CollageStyle>(style);

  const currentStyle = onStyleChange ? style : localStyle;
  const setStyle = onStyleChange || setLocalStyle;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onAdd) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          onAdd(file);
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canAddMore = photos.length < maxPhotos;
  const displayCount = photos.length + (canAddMore && editable ? 1 : 0);
  const gridClass = getGridClass(displayCount);
  const styleClass = `style-${currentStyle}`;

  const currentStyleInfo = STYLES.find(s => s.id === currentStyle) || STYLES[0];

  if (!photos || photos.length === 0) {
    if (!editable) {
      return (
        <p className="text-stone-400 text-sm">
          {language === "fr" ? "Aucune photo ajoutée." : "No photos added."}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-sage-700">
            {language === "fr" ? "Photos du collage" : "Collage photos"}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="collage-style-selector">
                {currentStyleInfo.icon}
                <span className="text-xs">
                  {language === "fr" ? currentStyleInfo.labelFr : currentStyleInfo.labelEn}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STYLES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={currentStyle === s.id ? "bg-sage-100" : ""}
                  data-testid={`style-option-${s.id}`}
                >
                  <span className="mr-2">{s.icon}</span>
                  {language === "fr" ? s.labelFr : s.labelEn}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div
          className="aspect-video rounded-lg border-2 border-dashed border-sage-300 hover:border-sage-400 hover:bg-sage-50 transition-colors flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-10 h-10 text-sage-400 mb-2" />
          <span className="text-sm text-sage-500">
            {language === "fr" ? "Ajouter des photos" : "Add photos"}
          </span>
          <span className="text-xs text-sage-400 mt-1">
            {language === "fr" ? `Maximum ${maxPhotos} photos` : `Maximum ${maxPhotos} photos`}
          </span>
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

  return (
    <div className="space-y-3">
      {editable && (
        <div className="flex items-center justify-between">
          <Label className="text-sm text-sage-700">
            {language === "fr" ? "Photos" : "Photos"} ({photos.length}/{maxPhotos})
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="collage-style-selector">
                {currentStyleInfo.icon}
                <span className="text-xs">
                  {language === "fr" ? currentStyleInfo.labelFr : currentStyleInfo.labelEn}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STYLES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={currentStyle === s.id ? "bg-sage-100" : ""}
                  data-testid={`style-option-${s.id}`}
                >
                  <span className="mr-2">{s.icon}</span>
                  {language === "fr" ? s.labelFr : s.labelEn}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className={`collage ${styleClass} ${gridClass}`}>
        {photos.map((src, index) => (
          <div key={index} className="collage-item relative group">
            <img src={src} alt={`Photo ${index + 1}`} />
            {editable && onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                data-testid={`remove-collage-photo-${index}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {editable && canAddMore && (
          <div
            className="collage-item flex items-center justify-center border-2 border-dashed border-sage-300 rounded-lg cursor-pointer hover:border-sage-400 hover:bg-sage-50 transition-colors min-h-[80px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-6 h-6 text-sage-400" />
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

export default CollageBlockNew;
