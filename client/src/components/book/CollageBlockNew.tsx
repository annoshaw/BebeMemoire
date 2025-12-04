import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import "./CollageBlock.css";

interface CollageBlockNewProps {
  images: string[];
  maxImages?: number;
  onAdd?: (file: File) => void;
  onRemove?: (index: number) => void;
  language?: "fr" | "en";
  editable?: boolean;
}

const getGridClass = (count: number): string => {
  if (count === 1) return "grid-1";
  if (count === 2) return "grid-2";
  if (count === 3) return "grid-3";
  if (count <= 4) return "grid-4";
  if (count <= 6) return "grid-6";
  if (count <= 9) return "grid-9";
  return "grid-15";
};

export function CollageBlockNew({
  images,
  maxImages = 15,
  onAdd,
  onRemove,
  language = "fr",
  editable = true,
}: CollageBlockNewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const canAddMore = images.length < maxImages;
  const gridClass = getGridClass(images.length + (canAddMore && editable ? 1 : 0));

  if (!images || images.length === 0) {
    if (!editable) {
      return (
        <p className="text-stone-400 text-sm">
          {language === "fr" ? "Aucune photo ajoutée." : "No photos added."}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm text-sage-700">
          {language === "fr" ? "Photos du collage" : "Collage photos"}
        </Label>
        <div
          className="aspect-video rounded-lg border-2 border-dashed border-sage-300 hover:border-sage-400 hover:bg-sage-50 transition-colors flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-10 h-10 text-sage-400 mb-2" />
          <span className="text-sm text-sage-500">
            {language === "fr" ? "Ajouter des photos" : "Add photos"}
          </span>
          <span className="text-xs text-sage-400 mt-1">
            {language === "fr" ? `Maximum ${maxImages} photos` : `Maximum ${maxImages} photos`}
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
    <div className="space-y-2">
      {editable && (
        <div className="flex items-center justify-between">
          <Label className="text-sm text-sage-700">
            {language === "fr" ? "Photos" : "Photos"} ({images.length}/{maxImages})
          </Label>
        </div>
      )}

      <div className={`collage ${gridClass}`}>
        {images.map((src, index) => (
          <div key={index} className="collage-item relative group">
            <img src={src} alt={`Photo ${index + 1}`} />
            {editable && onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
