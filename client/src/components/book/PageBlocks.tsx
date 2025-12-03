import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Image, 
  Video, 
  Plus, 
  X, 
  Camera, 
  Upload,
  Play,
  Trash2
} from "lucide-react";

interface TextBlockProps {
  prompts: string[];
  values: string[];
  onChange: (index: number, value: string) => void;
  language: "fr" | "en";
}

export function TextBlock({ prompts, values, onChange, language }: TextBlockProps) {
  return (
    <div className="space-y-4">
      {prompts.map((prompt, index) => (
        <div key={index} className="space-y-2">
          <Label className="text-sm text-sage-700 font-medium">{prompt}</Label>
          <Textarea
            data-testid={`text-block-${index}`}
            value={values[index] || ""}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder={language === "fr" ? "Écrivez ici..." : "Write here..."}
            className="min-h-[100px] resize-y border-sage-200 focus:border-sage-400"
          />
        </div>
      ))}
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
}

export function VideoBlock({ videoUrl, onAdd, onRemove, language }: VideoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onAdd(file);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm text-sage-700">
        {language === "fr" ? "Vidéo" : "Video"}
      </Label>

      {videoUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-sage-200">
          <video 
            src={videoUrl} 
            controls 
            className="w-full aspect-video object-cover"
          />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
            data-testid="remove-video"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="aspect-video rounded-lg border-2 border-dashed border-sage-300 hover:border-sage-400 hover:bg-sage-50 transition-colors flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          data-testid="add-video-button"
        >
          <Video className="w-12 h-12 text-sage-400 mb-3" />
          <span className="text-sm text-sage-500">
            {language === "fr" ? "Ajouter une vidéo" : "Add a video"}
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
