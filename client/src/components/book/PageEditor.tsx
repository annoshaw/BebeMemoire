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
import "./BookPageLayout.css";

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
  const [videoUrl, setVideoUrl] = useState<string | null>(
    userPage?.videoUrl || null
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

  // Block positions for free positioning (drag and drop)
  type BlockPosition = { x: number; y: number };
  const [blockPositions, setBlockPositions] = useState<{
    photos?: BlockPosition;
    texts?: Record<number, BlockPosition>;
    video?: BlockPosition;
  }>((userPage?.customData as any)?.blockPositions || {});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setTextContent((userPage?.textContent as string[]) || []);
    setPhotos((userPage?.photos as string[]) || []);
    setVideoUrl(userPage?.videoUrl || null);
    const data = (userPage?.customData as Record<string, any>) || {};
    const { photoLayouts: layouts, textStyles: styles, titleStyle: tStyle, blockPositions: positions, ...rest } = data;
    setCustomData(rest);
    setPhotoLayouts(layouts || {});
    setTextStyles(styles || {});
    setTitleStyle(tStyle || { fontFamily: "'Fraunces', serif", fontSize: 20 });
    setBlockPositions(positions || {});
    setIsDirty(false);
  }, [userPage, pageNumber]);

  const handleTextStyleChange = (index: number, style: TextStyle) => {
    setTextStyles(prev => ({ ...prev, [index]: style }));
    setIsDirty(true);
  };

  // Block position handlers
  const updateBlockPosition = (blockType: 'photos' | 'video', position: BlockPosition) => {
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
      
      // Merge photoLayouts, textStyles, titleStyle, and blockPositions into customData for saving
      const dataToSave = {
        ...customData,
        ...(Object.keys(photoLayouts).length > 0 ? { photoLayouts } : {}),
        ...(Object.keys(textStyles).length > 0 ? { textStyles } : {}),
        ...(Object.keys(blockPositions).length > 0 ? { blockPositions } : {}),
        titleStyle
      };
      
      const res = await fetch(`/api/books/${bookId}/pages/${userPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          textContent,
          photos,
          videoUrl,
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

  const handleVideoAdd = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoUrl(e.target?.result as string);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoRemove = () => {
    setVideoUrl(null);
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
              />
            )}
          </div>
        );

      case "collage":
        return (
          <div className="space-y-6">
            {prompts.length > 0 && (
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
            {prompts.length > 0 && (
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
                boxSizing: 'border-box'
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

              {/* Photos - Simple direct grid rendering */}
              <div 
                style={{ 
                  flex: 1,
                  minHeight: 0,
                  marginTop: '8px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}
              >
                {photos.length > 0 ? (
                  <div 
                    style={{ 
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      gridTemplateColumns: photos.length === 1 ? '1fr' 
                        : photos.length === 2 ? '1fr 1fr' 
                        : photos.length <= 4 ? 'repeat(2, 1fr)'
                        : photos.length <= 6 ? 'repeat(3, 1fr)'
                        : 'repeat(4, 1fr)',
                      gridTemplateRows: photos.length === 1 ? '1fr'
                        : photos.length === 2 ? '1fr'
                        : photos.length <= 4 ? 'repeat(2, 1fr)'
                        : photos.length <= 6 ? 'repeat(2, 1fr)'
                        : 'repeat(auto-fill, 1fr)',
                      gap: '4px'
                    }}
                  >
                    {photos.map((photo, index) => (
                      <div 
                        key={index}
                        style={{
                          overflow: 'hidden',
                          borderRadius: '4px',
                          minHeight: 0
                        }}
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (templatePage?.maxPhotos || 0) > 0 ? (
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f4',
                      borderRadius: '8px',
                      border: '2px dashed #d6d3d1'
                    }}
                  >
                    <div className="text-center text-stone-400">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-[10px]">
                        {language === "fr" ? "Ajoutez des photos" : "Add photos"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%' }} />
                )}
              </div>

              {/* Footer */}
              <div style={{ flexShrink: 0, maxHeight: '80px', overflow: 'hidden' }}>
                {/* Text Content */}
                {textContent.length > 0 && textContent.some(t => t && t.trim()) && (
                  <div className="space-y-1 text-stone-700">
                  {textContent.map((text, idx) => {
                    if (!text || !text.trim()) return null;
                    const style = textStyles[idx] || { bgColor: "#FFFFFF", textColor: "#374151", fontFamily: "'Poppins', sans-serif", fontSize: 14 };
                    const hasCustomBg = style.bgColor !== "#FFFFFF";
                    const previewFontSize = Math.max((style.fontSize || 14) * 0.75, 10);
                    const textPosition = getTextBlockPosition(idx);

                    return editMode ? (
                      <motion.p
                        key={idx}
                        drag
                        dragMomentum={false}
                        dragElastic={0}
                        initial={textPosition}
                        onDragEnd={(e, info) => updateTextBlockPosition(idx, { 
                          x: textPosition.x + info.offset.x, 
                          y: textPosition.y + info.offset.y 
                        })}
                        className={`leading-relaxed cursor-move ring-2 ring-sage-400 ring-offset-1 rounded ${hasCustomBg ? 'p-3 rounded-lg' : ''}`}
                        style={{ 
                          fontSize: `${previewFontSize}px`,
                          backgroundColor: hasCustomBg ? style.bgColor : 'transparent',
                          color: style.textColor,
                          fontFamily: style.fontFamily || "'Poppins', sans-serif"
                        }}
                      >
                        {text}
                      </motion.p>
                    ) : (
                      <p 
                        key={idx}
                        className={`leading-relaxed ${hasCustomBg ? 'p-3 rounded-lg' : ''}`} 
                        style={{ 
                          fontSize: `${previewFontSize}px`,
                          backgroundColor: hasCustomBg ? style.bgColor : 'transparent',
                          color: style.textColor,
                          fontFamily: style.fontFamily || "'Poppins', sans-serif",
                          transform: textPosition.x !== 0 || textPosition.y !== 0 
                            ? `translate(${textPosition.x}px, ${textPosition.y}px)` 
                            : undefined
                        }}
                      >
                        {text}
                      </p>
                    );
                  })}
                  </div>
                )}

                {/* Custom Data (Birth Info) - Filter out internal fields */}
                {(() => {
                  const displayData = Object.entries(customData).filter(
                    ([key, value]) => value && key !== 'collageStyle' && key !== 'blockPositions'
                  );
                  return displayData.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {displayData.map(([key, value]) => (
                        <div key={key} className="bg-stone-50 rounded p-1.5">
                          <p className="text-[10px] text-stone-500">{key}</p>
                          <p className="font-medium text-stone-800 text-xs">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Video with QR Code indicator in preview */}
                {videoUrl && (
                  <div className="p-2 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-white p-1 rounded shadow-sm">
                        {videoUrl.startsWith('data:') ? (
                          <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                            <Video className="w-3 h-3 text-purple-400" />
                          </div>
                        ) : (
                          <QRCodeSVG 
                            value={videoUrl}
                            size={24}
                            level="M"
                          />
                        )}
                      </div>
                      <span className="text-purple-700 font-medium text-[10px]">
                        {language === "fr" ? "Vidéo" : "Video"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Page number at bottom */}
                <div className="text-center pt-2 border-t border-stone-100">
                  <span className="text-xs text-stone-400">{pageNumber}</span>
                </div>
              </div>
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
