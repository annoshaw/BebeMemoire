import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft,
  Save,
  Check,
  Loader2,
  Eye,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Move,
  ZoomIn,
  RotateCcw,
  Type,
  ALargeSmall,
  Palette
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  TextBlock, 
  PhotoBlock, 
  VideoBlock, 
  BirthInfoBlock, 
  MessageBlock 
} from "./PageBlocks";
import { CollageBlockNew, type CollageStyle } from "./CollageBlockNew";
import type { TemplatePage, UserBookPage } from "@shared/schema";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import Draggable from "react-draggable";
import "./BookPageLayout.css";
import "./CollageBlock.css";

// Title font and size options
const TITLE_FONTS = [
  { name: "Fraunces", family: "'Fraunces', serif", category: "Classique" },
  { name: "Poppins", family: "'Poppins', sans-serif", category: "Tendance" },
  { name: "Raleway", family: "'Raleway', sans-serif", category: "Tendance" },
  { name: "Quicksand", family: "'Quicksand', sans-serif", category: "Tendance" },
  { name: "Georgia", family: "'Georgia', serif", category: "Classique" },
  { name: "Playfair Display", family: "'Playfair Display', serif", category: "Classique" },
  { name: "Dancing Script", family: "'Dancing Script', cursive", category: "Féminin" },
  { name: "Great Vibes", family: "'Great Vibes', cursive", category: "Féminin" },
  { name: "Parisienne", family: "'Parisienne', cursive", category: "Féminin" },
  { name: "Roboto", family: "'Roboto', sans-serif", category: "Masculin" },
  { name: "Oswald", family: "'Oswald', sans-serif", category: "Masculin" },
  { name: "Montserrat", family: "'Montserrat', sans-serif", category: "Masculin" },
];

const TITLE_SIZES = [
  { value: 16, label: "Petit" },
  { value: 20, label: "Normal" },
  { value: 24, label: "Moyen" },
  { value: 28, label: "Grand" },
  { value: 32, label: "Très grand" },
];

// Text/Photo Layout options
type TextLayoutPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface TextLayout {
  position: TextLayoutPosition;
  textSize: number; // percentage of available space for text (20-50%)
}

const TEXT_LAYOUTS: { id: TextLayoutPosition; labelFr: string; labelEn: string; icon: string }[] = [
  { id: 'top', labelFr: 'Texte en haut', labelEn: 'Text on top', icon: '⬆️' },
  { id: 'bottom', labelFr: 'Texte en bas', labelEn: 'Text at bottom', icon: '⬇️' },
  { id: 'left', labelFr: 'Texte à gauche', labelEn: 'Text on left', icon: '⬅️' },
  { id: 'right', labelFr: 'Texte à droite', labelEn: 'Text on right', icon: '➡️' },
  { id: 'center', labelFr: 'Texte au centre', labelEn: 'Text in center', icon: '⏺️' },
];

interface PageEditorProps {
  bookId: string;
  pageNumber: number;
  templatePage: TemplatePage | null;
  userPage: UserBookPage | null;
  language: "fr" | "en";
  onBack: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function PageEditor({
  bookId,
  pageNumber,
  templatePage,
  userPage,
  language,
  onBack,
  onNavigate,
  hasNext,
  hasPrev,
}: PageEditorProps) {
  const queryClient = useQueryClient();

  const [textContent, setTextContent] = useState<string[]>(
    (userPage?.textContent as string[]) || []
  );
  const [photos, setPhotos] = useState<string[]>(
    (userPage?.photos as string[]) || []
  );
  // Only accept S3 URLs (https://), not base64 data URLs
  const [videoUrl, setVideoUrl] = useState<string | null>(() => {
    const url = userPage?.videoUrl;
    if (url && url.startsWith('https://')) {
      return url;
    }
    return null;
  });
  const [videoMediaId, setVideoMediaId] = useState<string | null>(
    (userPage as any)?.videoMediaId || null
  );
  const [customData, setCustomData] = useState<Record<string, string>>(
    (userPage?.customData as Record<string, string>) || {}
  );
  const [collageStyle, setCollageStyle] = useState<CollageStyle>(
    ((userPage?.customData as Record<string, string>)?.collageStyle as CollageStyle) || "grid"
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Photo layout state: { photoIndex: { scale, x, y } }
  type PhotoLayout = { scale: number; x: number; y: number };
  const [photoLayouts, setPhotoLayouts] = useState<Record<number, PhotoLayout>>(
    (userPage?.customData as any)?.photoLayouts || {}
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; photoX: number; photoY: number } | null>(null);

  // Text styles state: { textIndex: { bgColor, textColor, fontFamily, fontSize } }
  type TextStyle = { bgColor: string; textColor: string; fontFamily?: string; fontSize?: number };
  const [textStyles, setTextStyles] = useState<Record<number, TextStyle>>(
    (userPage?.customData as any)?.textStyles || {}
  );

  // Title style state
  type TitleStyle = { fontFamily: string; fontSize: number };
  const [titleStyle, setTitleStyle] = useState<TitleStyle>(
    (userPage?.customData as any)?.titleStyle || { fontFamily: "'Fraunces', serif", fontSize: 20 }
  );

  // Text layout position state
  const [textLayout, setTextLayout] = useState<TextLayout>(
    (userPage?.customData as any)?.textLayout || { position: 'bottom', textSize: 25 }
  );

  // Block positions for free positioning (drag and drop)
  type BlockPosition = { x: number; y: number };
  const [blockPositions, setBlockPositions] = useState<{
    photos?: BlockPosition;
    texts?: Record<number, BlockPosition>;
    video?: BlockPosition;
    qr?: BlockPosition;
  }>((userPage?.customData as any)?.blockPositions || {});
  const [editMode, setEditMode] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  useEffect(() => {
    setTextContent((userPage?.textContent as string[]) || []);
    setPhotos((userPage?.photos as string[]) || []);
    // Only accept S3 URLs (https://), filter out base64 data URLs
    const videoUrlFromDb = userPage?.videoUrl;
    if (videoUrlFromDb && videoUrlFromDb.startsWith('https://')) {
      setVideoUrl(videoUrlFromDb);
    } else {
      setVideoUrl(null);
    }
    setVideoMediaId((userPage as any)?.videoMediaId || null);
    const data = (userPage?.customData as Record<string, any>) || {};
    const { photoLayouts: layouts, textStyles: styles, titleStyle: tStyle, blockPositions: positions, textLayout: tLayout, ...rest } = data;
    setCustomData(rest);
    setPhotoLayouts(layouts || {});
    setTextStyles(styles || {});
    setTitleStyle(tStyle || { fontFamily: "'Fraunces', serif", fontSize: 20 });
    setTextLayout(tLayout || { position: 'bottom', textSize: 25 });
    setBlockPositions(positions || {});
    setIsDirty(false);
  }, [userPage, pageNumber]);

  const handleTextStyleChange = (index: number, style: TextStyle) => {
    setTextStyles(prev => ({ ...prev, [index]: style }));
    setIsDirty(true);
  };

  // Block position handlers
  const updateBlockPosition = (blockType: 'photos' | 'video' | 'qr', position: BlockPosition) => {
    setBlockPositions(prev => ({ ...prev, [blockType]: position }));
    setIsDirty(true);
  };

  const updateTextBlockPosition = (index: number, position: BlockPosition) => {
    setBlockPositions(prev => ({
      ...prev,
      texts: { ...prev.texts, [index]: position }
    }));
    setIsDirty(true);
  };

  const getTextBlockPosition = (index: number): BlockPosition => {
    return blockPositions.texts?.[index] || { x: 0, y: 0 };
  };

  const handleTitleStyleChange = (updates: Partial<TitleStyle>) => {
    setTitleStyle(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  // Apply style to all pages
  const [applyingStyle, setApplyingStyle] = useState(false);

  const applyStyleToAllPages = async (styleType: 'title' | 'description' | 'collage') => {
    setApplyingStyle(true);
    try {
      const res = await fetch(`/api/books/${bookId}/apply-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          styleType,
          titleStyle: styleType === 'title' ? titleStyle : undefined,
          textStyle: styleType === 'description' ? textStyles[0] : undefined,
          collageStyle: styleType === 'collage' ? collageStyle : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to apply style");

      await queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/pages`] });
      
      const messages = {
        title: language === "fr" ? "Style de titre appliqué à toutes les pages" : "Title style applied to all pages",
        description: language === "fr" ? "Style de description appliqué à toutes les pages" : "Description style applied to all pages",
        collage: language === "fr" ? "Style de collage appliqué à toutes les pages photos" : "Collage style applied to all photo pages"
      };
      toast.success(messages[styleType]);
    } catch (error) {
      toast.error(language === "fr" ? "Erreur lors de l'application du style" : "Error applying style");
    } finally {
      setApplyingStyle(false);
    }
  };

  const getPhotoLayout = (index: number): PhotoLayout => {
    return photoLayouts[index] || { scale: 100, x: 0, y: 0 };
  };

  const updatePhotoLayout = (index: number, updates: Partial<PhotoLayout>) => {
    setPhotoLayouts(prev => ({
      ...prev,
      [index]: { ...getPhotoLayout(index), ...updates }
    }));
    setIsDirty(true);
  };

  const resetPhotoLayout = (index: number) => {
    setPhotoLayouts(prev => {
      const newLayouts = { ...prev };
      delete newLayouts[index];
      return newLayouts;
    });
    setIsDirty(true);
  };

  const handlePhotoMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setActivePhotoIndex(index);
    setIsDragging(true);
    const layout = getPhotoLayout(index);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      photoX: layout.x,
      photoY: layout.y
    };
  };

  const handlePhotoMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || activePhotoIndex === null || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    updatePhotoLayout(activePhotoIndex, {
      x: Math.max(-50, Math.min(50, dragStartRef.current.photoX + dx / 2)),
      y: Math.max(-50, Math.min(50, dragStartRef.current.photoY + dy / 2))
    });
  }, [isDragging, activePhotoIndex]);

  const handlePhotoMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userPage?.id) throw new Error("No user page found");
      
      // Merge photoLayouts, textStyles, titleStyle, textLayout and blockPositions into customData for saving
      const dataToSave = {
        ...customData,
        ...(Object.keys(photoLayouts).length > 0 ? { photoLayouts } : {}),
        ...(Object.keys(textStyles).length > 0 ? { textStyles } : {}),
        ...(Object.keys(blockPositions).length > 0 ? { blockPositions } : {}),
        titleStyle,
        textLayout
      };
      
      // Only save video URL if it's a valid S3 URL (not base64)
      const videoUrlToSave = videoUrl && videoUrl.startsWith('https://') ? videoUrl : null;
      
      const res = await fetch(`/api/books/${bookId}/pages/${userPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          textContent,
          photos,
          videoUrl: videoUrlToSave,
          videoMediaId,
          customData: dataToSave,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
      setIsDirty(false);
      toast.success(language === "fr" ? "Sauvegardé !" : "Saved!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!userPage?.id) throw new Error("No user page found");
      
      await saveMutation.mutateAsync();
      
      const res = await fetch(`/api/books/${bookId}/pages/${userPage.id}/complete`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to mark complete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
      toast.success(language === "fr" ? "Page marquée comme complète !" : "Page marked as complete!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleTextChange = (index: number, value: string) => {
    const newContent = [...textContent];
    newContent[index] = value;
    setTextContent(newContent);
    setIsDirty(true);
  };

  const handlePhotoAdd = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos([...photos, e.target?.result as string]);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleVideoAdd = async (file: File) => {
    setIsVideoUploading(true);
    try {
      const response = await fetch('/api/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          bookId,
          pageId: userPage?.id,
          mediaType: 'video'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la préparation de l\'upload');
      }

      const { mediaId, uploadUrl } = await response.json();

      console.log('Uploading video to S3...', { uploadUrl: uploadUrl.substring(0, 100) + '...' });
      
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => 'Unknown error');
          console.error('S3 upload failed:', uploadResponse.status, errorText);
          throw new Error(`Erreur S3 (${uploadResponse.status}): ${errorText.substring(0, 100)}`);
        }
        
        console.log('S3 upload successful!');
      } catch (uploadError) {
        console.error('S3 upload error (possibly CORS):', uploadError);
        if (uploadError instanceof TypeError && uploadError.message.includes('Failed to fetch')) {
          throw new Error('Erreur CORS: Le bucket S3 doit être configuré pour autoriser les uploads depuis ce domaine');
        }
        throw uploadError;
      }

      const confirmResponse = await fetch(`/api/media/${mediaId}/confirm`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!confirmResponse.ok) {
        throw new Error('Erreur lors de la confirmation');
      }

      const { downloadUrl, mediaId: confirmedMediaId } = await confirmResponse.json();
      setVideoUrl(downloadUrl);
      setVideoMediaId(confirmedMediaId);
      setIsDirty(true);
      toast.success(language === 'fr' ? 'Vidéo téléversée!' : 'Video uploaded!');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur de téléversement');
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleVideoRemove = () => {
    setVideoUrl(null);
    setVideoMediaId(null);
    setIsDirty(true);
  };

  const handleCustomDataChange = (field: string, value: string) => {
    setCustomData({ ...customData, [field]: value });
    setIsDirty(true);
  };

  const handleCollageStyleChange = (style: CollageStyle) => {
    setCollageStyle(style);
    setCustomData({ ...customData, collageStyle: style });
    setIsDirty(true);
  };

  const prompts = language === "fr" 
    ? (templatePage?.promptsFr as string[]) || []
    : (templatePage?.promptsEn as string[]) || [];

  const pageType = templatePage?.pageType || "text_photo";
  const maxPhotos = templatePage?.maxPhotos || 1;
  const hasVideo = templatePage?.hasVideo || false;
  const hasTextBlocks = (templatePage?.hasTextBlocks || 0) > 0;
  const shouldShowTextBlock = hasTextBlocks || prompts.length > 0;

  // Extract month number from page title or customData for monthHero style
  const getMonthNumber = (): number | undefined => {
    // First check customData for explicit month
    if (customData?.month) {
      return parseInt(customData.month, 10);
    }
    // Try to extract from page title
    const title = language === "fr" ? templatePage?.titleFr : templatePage?.titleEn;
    if (title) {
      // Match patterns like "Mois 5", "5 mois", "Month 5", "5 months", etc.
      const match = title.match(/(\d+)\s*(mois|month|months)/i) || title.match(/(mois|month|months?)\s*(\d+)/i);
      if (match) {
        const num = match[1]?.match(/\d+/) ? parseInt(match[1], 10) : parseInt(match[2], 10);
        if (!isNaN(num)) return num;
      }
    }
    // For monthly milestone pages, derive from page number if available
    if ((pageType === "monthly_milestone" || pageType === "pregnancy_month") && pageNumber) {
      return pageNumber;
    }
    return undefined;
  };

  const monthNumber = getMonthNumber();

  const renderPageContent = () => {
    switch (pageType) {
      case "birth_info":
        return (
          <div className="space-y-6">
            <BirthInfoBlock
              data={customData}
              onChange={handleCustomDataChange}
              language={language}
            />
            {maxPhotos > 0 && (
              <CollageBlockNew
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
                style={collageStyle}
                onStyleChange={handleCollageStyleChange}
                onApplyToAll={() => applyStyleToAllPages('collage')}
                applyingToAll={applyingStyle}
                month={monthNumber}
              />
            )}
            {hasVideo && (
              <VideoBlock
                videoUrl={videoUrl}
                onAdd={handleVideoAdd}
                onRemove={handleVideoRemove}
                language={language}
                isUploading={isVideoUploading}
              />
            )}
          </div>
        );

      case "collage":
        return (
          <div className="space-y-6">
            {shouldShowTextBlock && (
              <TextBlock
                prompts={prompts.length > 0 ? prompts : [language === "fr" ? "Décrivez ce moment..." : "Describe this moment..."]}
                values={textContent}
                onChange={handleTextChange}
                language={language}
                textStyles={textStyles}
                onStyleChange={handleTextStyleChange}
                photos={photos}
                onApplyStyleToAll={() => applyStyleToAllPages('description')}
                applyingStyle={applyingStyle}
              />
            )}
            <CollageBlockNew
              photos={photos}
              maxPhotos={maxPhotos}
              onAdd={handlePhotoAdd}
              onRemove={handlePhotoRemove}
              language={language}
              style={collageStyle}
              onStyleChange={handleCollageStyleChange}
              onApplyToAll={() => applyStyleToAllPages('collage')}
              applyingToAll={applyingStyle}
              month={monthNumber}
            />
            {hasVideo && (
              <VideoBlock
                videoUrl={videoUrl}
                onAdd={handleVideoAdd}
                onRemove={handleVideoRemove}
                language={language}
                isUploading={isVideoUploading}
              />
            )}
          </div>
        );

      case "message":
        return (
          <div className="space-y-6">
            <MessageBlock
              message={textContent[0] || ""}
              onChange={(value) => handleTextChange(0, value)}
              language={language}
            />
            {maxPhotos > 0 && (
              <CollageBlockNew
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
                style={collageStyle}
                onStyleChange={handleCollageStyleChange}
                onApplyToAll={() => applyStyleToAllPages('collage')}
                applyingToAll={applyingStyle}
                month={monthNumber}
              />
            )}
            {hasVideo && (
              <VideoBlock
                videoUrl={videoUrl}
                onAdd={handleVideoAdd}
                onRemove={handleVideoRemove}
                language={language}
                isUploading={isVideoUploading}
              />
            )}
          </div>
        );

      case "dual_profile":
      case "dual_reaction":
      case "family_tree":
        return (
          <div className="space-y-6">
            <TextBlock
              prompts={prompts}
              values={textContent}
              onChange={handleTextChange}
              language={language}
              textStyles={textStyles}
              onStyleChange={handleTextStyleChange}
              photos={photos}
              onApplyStyleToAll={() => applyStyleToAllPages('description')}
              applyingStyle={applyingStyle}
            />
            <CollageBlockNew
              photos={photos}
              maxPhotos={maxPhotos}
              onAdd={handlePhotoAdd}
              onRemove={handlePhotoRemove}
              language={language}
              style={collageStyle}
              onStyleChange={handleCollageStyleChange}
              onApplyToAll={() => applyStyleToAllPages('collage')}
              applyingToAll={applyingStyle}
              month={monthNumber}
            />
            {hasVideo && (
              <VideoBlock
                videoUrl={videoUrl}
                onAdd={handleVideoAdd}
                onRemove={handleVideoRemove}
                language={language}
                isUploading={isVideoUploading}
              />
            )}
          </div>
        );

      case "name_choice":
        return (
          <div className="space-y-6">
            <TextBlock
              prompts={prompts}
              values={textContent}
              onChange={handleTextChange}
              language={language}
              textStyles={textStyles}
              onStyleChange={handleTextStyleChange}
              photos={photos}
              separateFields={true}
              onApplyStyleToAll={() => applyStyleToAllPages('description')}
              applyingStyle={applyingStyle}
            />
          </div>
        );

      case "pregnancy_month":
      case "monthly_milestone":
      case "text_photo":
      case "text_photo_video":
      default:
        return (
          <div className="space-y-6">
            {shouldShowTextBlock && (
              <TextBlock
                prompts={prompts.length > 0 ? prompts : [language === "fr" ? "Décrivez ce moment..." : "Describe this moment..."]}
                values={textContent}
                onChange={handleTextChange}
                language={language}
                textStyles={textStyles}
                onStyleChange={handleTextStyleChange}
                photos={photos}
                onApplyStyleToAll={() => applyStyleToAllPages('description')}
                applyingStyle={applyingStyle}
              />
            )}
            {maxPhotos > 0 && (
              <CollageBlockNew
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
                style={collageStyle}
                onStyleChange={handleCollageStyleChange}
                onApplyToAll={() => applyStyleToAllPages('collage')}
                applyingToAll={applyingStyle}
                month={monthNumber}
              />
            )}
            {hasVideo && (
              <VideoBlock
                videoUrl={videoUrl}
                onAdd={handleVideoAdd}
                onRemove={handleVideoRemove}
                language={language}
                isUploading={isVideoUploading}
              />
            )}
          </div>
        );
    }
  };

  const isSaving = saveMutation.isPending || completeMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          data-testid="back-to-parts"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {language === "fr" ? "Retour" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("prev")}
            disabled={!hasPrev}
            data-testid="prev-page"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-sage-600 px-2">
            {language === "fr" ? "Page" : "Page"} {pageNumber}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("next")}
            disabled={!hasNext}
            data-testid="next-page"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border-sage-200">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {language === "fr" ? "Page" : "Page"} {pageNumber}
                </Badge>
                <Badge variant="secondary">
                  {pageType.replace(/_/g, " ")}
                </Badge>
                {userPage?.isCompleted && (
                  <Badge className="bg-green-500">
                    <Check className="w-3 h-3 mr-1" />
                    {language === "fr" ? "Complété" : "Completed"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl" style={{ fontFamily: titleStyle.fontFamily, fontSize: `${titleStyle.fontSize}px` }}>
                  {language === "fr" 
                    ? templatePage?.titleFr 
                    : templatePage?.titleEn}
                </CardTitle>
                
                {/* Title Style Pickers */}
                <div className="flex gap-1">
                  {/* Title Font Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7">
                        <Type className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 bg-white shadow-lg border border-stone-200" align="start">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-stone-600">
                          {language === "fr" ? "Police du titre" : "Title font"}
                        </p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {TITLE_FONTS.map((font) => (
                            <button
                              key={font.name}
                              onClick={() => handleTitleStyleChange({ fontFamily: font.family })}
                              className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                                titleStyle.fontFamily === font.family
                                  ? "border-sage-500 bg-sage-50"
                                  : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                              }`}
                              style={{ fontFamily: font.family }}
                            >
                              <span className="text-sm">{font.name}</span>
                              <span className="text-xs text-stone-400 ml-2">({font.category})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Title Size Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7">
                        <ALargeSmall className="w-3.5 h-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3 bg-white shadow-lg border border-stone-200" align="start">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-stone-600">
                          {language === "fr" ? "Taille du titre" : "Title size"}
                        </p>
                        <div className="space-y-1">
                          {TITLE_SIZES.map((size) => (
                            <button
                              key={size.value}
                              onClick={() => handleTitleStyleChange({ fontSize: size.value })}
                              className={`w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between ${
                                titleStyle.fontSize === size.value
                                  ? "border-sage-500 bg-sage-50"
                                  : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                              }`}
                            >
                              <span style={{ fontSize: `${Math.min(size.value, 18)}px` }}>{size.label}</span>
                              <span className="text-xs text-stone-400">{size.value}px</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Apply to all titles */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => applyStyleToAllPages('title')}
                    disabled={applyingStyle}
                  >
                    {language === "fr" ? "Appliquer à tous" : "Apply to all"}
                  </Button>
                </div>
              </div>
              {templatePage?.subtitleFr && (
                <CardDescription>
                  {language === "fr" 
                    ? templatePage?.subtitleFr 
                    : templatePage?.subtitleEn}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {renderPageContent()}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 sticky bottom-4">
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          data-testid="preview-page"
        >
          <Eye className="w-4 h-4 mr-2" />
          {language === "fr" ? "Aperçu" : "Preview"}
        </Button>

        <Button
          variant="outline"
          onClick={() => saveMutation.mutate()}
          disabled={isSaving || !isDirty}
          data-testid="save-page"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {language === "fr" ? "Sauvegarder" : "Save"}
        </Button>

        {!userPage?.isCompleted && (
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
            data-testid="complete-page"
          >
            {completeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {language === "fr" ? "Marquer comme complété" : "Mark as complete"}
          </Button>
        )}
      </div>

      {/* Page Preview Modal - 8x11 Book Format */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b bg-stone-50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-fraunces">
                  {language === "fr" ? "Aperçu de la page" : "Page Preview"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {language === "fr" 
                    ? "Voici comment la page apparaîtra dans votre livre imprimé (format 8×11 pouces)"
                    : "This is how the page will appear in your printed book (8×11 inches format)"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Text Layout Selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {language === "fr" ? "Position texte" : "Text position"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 bg-[#ffffff] text-center" align="end">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-stone-600 mb-2">
                        {language === "fr" ? "Positionnement du texte" : "Text positioning"}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {TEXT_LAYOUTS.map((layout) => (
                          <button
                            key={layout.id}
                            onClick={() => {
                              setTextLayout({ ...textLayout, position: layout.id });
                              setIsDirty(true);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                              textLayout.position === layout.id
                                ? "border-sage-500 bg-sage-50"
                                : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                            }`}
                            title={language === "fr" ? layout.labelFr : layout.labelEn}
                          >
                            <span className="text-lg">{layout.icon}</span>
                            <span className="text-[9px] text-stone-500 mt-1">
                              {language === "fr" ? layout.labelFr.replace("Texte ", "") : layout.labelEn.replace("Text ", "")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant={editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2"
                >
                  <Move className="w-4 h-4" />
                  {editMode 
                    ? (language === "fr" ? "Mode aperçu" : "Preview mode")
                    : (language === "fr" ? "Repositionner" : "Reposition")}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-4 bg-stone-100 flex justify-center items-start overflow-auto max-h-[calc(95vh-180px)]">
            {/* Book page 8x11 - Simple isolated preview */}
            <div 
              className="bg-white shadow-2xl border border-stone-300"
              style={{
                width: '400px',
                height: '550px',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                boxSizing: 'border-box',
                position: 'relative'
              }}
              onMouseMove={handlePhotoMouseMove}
              onMouseUp={handlePhotoMouseUp}
              onMouseLeave={handlePhotoMouseUp}
            >
              {/* Header */}
              <div 
                className="text-center border-b border-stone-200 pb-2"
                style={{ flexShrink: 0 }}
              >
                <h2 
                  className="font-bold text-stone-800"
                  style={{ 
                    fontFamily: titleStyle.fontFamily, 
                    fontSize: `${Math.max(titleStyle.fontSize * 0.55, 11)}px`,
                    lineHeight: 1.2
                  }}
                >
                  {language === "fr" ? templatePage?.titleFr : templatePage?.titleEn}
                </h2>
                {templatePage?.subtitleFr && (
                  <p className="text-[9px] text-stone-500 mt-0.5">
                    {language === "fr" ? templatePage?.subtitleFr : templatePage?.subtitleEn}
                  </p>
                )}
              </div>

              {/* Dynamic Layout Body - Photos and Text based on textLayout.position */}
              {(() => {
                const hasText = textContent.length > 0 && textContent.some(t => t && t.trim());
                
                const calculateAutoTextSize = (): number => {
                  const totalChars = textContent.reduce((sum, text) => sum + (text?.length || 0), 0);
                  const lineCount = textContent.filter(t => t && t.trim()).length;
                  const avgLineLength = lineCount > 0 ? totalChars / lineCount : 0;
                  const estimatedLines = Math.ceil(totalChars / 40);
                  const basePercent = Math.min(15 + (estimatedLines * 5), 50);
                  return Math.max(15, Math.min(basePercent, 50));
                };
                
                const textSizePercent = hasText ? calculateAutoTextSize() : 25;
                
                const renderTextBlock = () => (
                  <div 
                    className="space-y-1 text-stone-700 p-2 overflow-auto"
                    style={{ maxWidth: '100%', minWidth: 0 }}
                  >
                    {textContent.map((text, idx) => {
                      if (!text || !text.trim()) return null;
                      const style = textStyles[idx] || { bgColor: "#FFFFFF", textColor: "#374151", fontFamily: "'Poppins', sans-serif", fontSize: 14 };
                      const hasCustomBg = style.bgColor !== "#FFFFFF";
                      const previewFontSize = Math.max((style.fontSize || 14) * 0.7, 9);
                      return (
                        <p 
                          key={idx}
                          className={`leading-snug ${hasCustomBg ? 'px-2 py-1 rounded' : ''}`} 
                          style={{ 
                            fontSize: `${previewFontSize}px`,
                            backgroundColor: hasCustomBg ? style.bgColor : 'transparent',
                            color: style.textColor,
                            fontFamily: style.fontFamily || "'Poppins', sans-serif",
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            hyphens: 'auto',
                            maxWidth: '100%'
                          }}
                        >
                          {text}
                        </p>
                      );
                    })}
                  </div>
                );

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

                const renderPhotosGrid = () => {
                  if (photos.length > 0) {
                    const gridClass = getGridClass(photos.length);
                    const styleClass = `style-${collageStyle}`;
                    return (
                      <div 
                        className={`collage ${styleClass} ${gridClass}`}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {collageStyle === "monthHero" && monthNumber !== undefined && (
                          <div className="month-hero-number">
                            <span className="month-digit">{monthNumber}</span>
                            <span className="month-label">{language === "fr" ? "mois" : "months"}</span>
                          </div>
                        )}
                        {photos.map((photo, index) => (
                          <div key={index} className="collage-item">
                            <img src={photo} alt={`Photo ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  if ((templatePage?.maxPhotos || 0) > 0) {
                    return (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f4', borderRadius: '8px', border: '2px dashed #d6d3d1' }}>
                        <div className="text-center text-stone-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-[10px]">{language === "fr" ? "Ajoutez des photos" : "Add photos"}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                };

                const layoutPosition = textLayout.position;

                if (layoutPosition === 'top') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', display: 'grid', gridTemplateRows: hasText ? `${textSizePercent}% 1fr` : '1fr', gap: '8px', overflow: 'hidden' }}>
                      {hasText && <div style={{ overflow: 'auto', borderBottom: '1px solid #e5e5e5' }}>{renderTextBlock()}</div>}
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                    </div>
                  );
                }

                if (layoutPosition === 'bottom') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', display: 'grid', gridTemplateRows: hasText ? `1fr ${textSizePercent}%` : '1fr', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                      {hasText && <div style={{ overflow: 'auto', borderTop: '1px solid #e5e5e5' }}>{renderTextBlock()}</div>}
                    </div>
                  );
                }

                if (layoutPosition === 'left') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: hasText ? `${textSizePercent}% 1fr` : '1fr', gap: '8px', overflow: 'hidden' }}>
                      {hasText && <div style={{ overflow: 'auto', borderRight: '1px solid #e5e5e5', paddingRight: '8px' }}>{renderTextBlock()}</div>}
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                    </div>
                  );
                }

                if (layoutPosition === 'right') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: hasText ? `1fr ${textSizePercent}%` : '1fr', gap: '8px', overflow: 'hidden' }}>
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                      {hasText && <div style={{ overflow: 'auto', borderLeft: '1px solid #e5e5e5', paddingLeft: '8px' }}>{renderTextBlock()}</div>}
                    </div>
                  );
                }

                if (layoutPosition === 'center') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%' }}>{renderPhotosGrid()}</div>
                      {hasText && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)', 
                          backgroundColor: 'rgba(255,255,255,0.95)', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          maxWidth: '70%', 
                          maxHeight: '50%', 
                          overflow: 'auto',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}>
                          {renderTextBlock()}
                        </div>
                      )}
                    </div>
                  );
                }

                // Default fallback (bottom)
                return (
                  <div style={{ flex: 1, minHeight: 0, marginTop: '8px', marginBottom: '8px', display: 'grid', gridTemplateRows: hasText ? '1fr 25%' : '1fr', gap: '8px', overflow: 'hidden' }}>
                    <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                    {hasText && <div style={{ overflow: 'auto', borderTop: '1px solid #e5e5e5' }}>{renderTextBlock()}</div>}
                  </div>
                );
              })()}

              {/* Footer with custom data and page number */}
              <div style={{ flexShrink: 0, paddingTop: '4px' }}>
                {/* Custom Data (Birth Info) - Filter out internal fields */}
                {(() => {
                  const displayData = Object.entries(customData).filter(
                    ([key, value]) => value && key !== 'collageStyle' && key !== 'blockPositions' && key !== 'textLayout' && key !== 'qrPosition'
                  );
                  return displayData.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 text-center mb-1">
                      {displayData.map(([key, value]) => (
                        <div key={key} className="bg-stone-50 rounded p-1">
                          <p className="text-[8px] text-stone-500">{key}</p>
                          <p className="font-medium text-stone-800 text-[10px]">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Page number at bottom */}
                <div className="text-center pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400">{pageNumber}</span>
                </div>
              </div>

              {/* Debug: Show video status */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-2 left-2 text-[8px] bg-yellow-100 p-1 rounded z-20 max-w-[150px] break-all">
                  URL: {videoUrl ? (videoUrl.startsWith('http') ? 'Valid' : 'Invalid') : 'None'}
                  <br/>
                  {videoUrl && videoUrl.substring(0, 30)}...
                </div>
              )}
              
              {/* Draggable QR Code - Positioned intelligently based on text layout */}
              {videoUrl && (videoUrl.startsWith('https://') || videoUrl.startsWith('http://')) && (
                <Draggable
                  bounds="parent"
                  defaultPosition={blockPositions.qr || (() => {
                    const pageWidth = 400;
                    const pageHeight = 550;
                    const qrSize = 120;
                    const margin = 8;
                    
                    switch (textLayout.position) {
                      case 'bottom':
                        return { x: pageWidth - qrSize - margin, y: margin };
                      case 'top':
                        return { x: pageWidth - qrSize - margin, y: pageHeight - qrSize - margin };
                      case 'left':
                        return { x: pageWidth - qrSize - margin, y: pageHeight - qrSize - margin };
                      case 'right':
                        return { x: margin, y: pageHeight - qrSize - margin };
                      case 'center':
                      default:
                        return { x: pageWidth - qrSize - margin, y: margin };
                    }
                  })()}
                  onStop={(e, data) => {
                    updateBlockPosition('qr', { x: data.x, y: data.y });
                  }}
                >
                  <div 
                    style={{ 
                      position: 'absolute',
                      cursor: 'move',
                      zIndex: 10
                    }}
                  >
                    <div className="bg-white p-2 rounded-lg shadow-lg border-2 border-purple-300 hover:border-purple-500 transition-colors">
                      <QRCodeSVG 
                        value={videoUrl} 
                        size={100} 
                        level="H"
                        includeMargin={true}
                      />
                      <p className="text-center text-[8px] text-purple-600 mt-1 font-medium">
                        {language === "fr" ? "Scannez pour la vidéo" : "Scan for video"}
                      </p>
                    </div>
                  </div>
                </Draggable>
              )}
            </div>
          </div>

          {/* Photo Controls - Collapsible Bottom Panel */}
          {photos.length > 0 && activePhotoIndex !== null && (
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <img 
                    src={photos[activePhotoIndex]} 
                    alt="Selected" 
                    className="w-10 h-10 object-cover rounded border"
                  />
                  <span className="text-sm font-medium text-stone-700">
                    Photo {activePhotoIndex + 1}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <ZoomIn className="w-4 h-4 text-stone-500" />
                  <Slider
                    value={[getPhotoLayout(activePhotoIndex).scale]}
                    onValueChange={([value]) => updatePhotoLayout(activePhotoIndex, { scale: value })}
                    min={50}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-stone-500 w-12">
                    {getPhotoLayout(activePhotoIndex).scale}%
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Move className="w-3 h-3" />
                  <span>{language === "fr" ? "Glissez pour repositionner" : "Drag to reposition"}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetPhotoLayout(activePhotoIndex)}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {language === "fr" ? "Reset" : "Reset"}
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 border-t bg-white flex justify-between items-center">
            <p className="text-xs text-stone-500">
              {photos.length > 0 && !activePhotoIndex && (
                <span>
                  {language === "fr" 
                    ? "Cliquez sur une photo pour l'ajuster" 
                    : "Click a photo to adjust it"}
                </span>
              )}
              {isDirty && (
                <span className="text-amber-600 ml-2">
                  {language === "fr" ? "• Modifications non sauvegardées" : "• Unsaved changes"}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {isDirty && (
                <Button 
                  onClick={() => saveMutation.mutate()} 
                  disabled={saveMutation.isPending}
                  className="bg-sage-600 hover:bg-sage-700"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {language === "fr" ? "Sauvegarder" : "Save"}
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowPreview(false)} data-testid="close-preview">
                {language === "fr" ? "Fermer" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
