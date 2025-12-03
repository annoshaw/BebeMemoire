import { useState, useEffect, useRef, useCallback } from "react";
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
  RotateCcw
} from "lucide-react";
import { 
  TextBlock, 
  PhotoBlock, 
  VideoBlock, 
  BirthInfoBlock, 
  CollageBlock, 
  MessageBlock 
} from "./PageBlocks";
import type { TemplatePage, UserBookPage } from "@shared/schema";
import { toast } from "sonner";

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

  // Text styles state: { textIndex: { bgColor, textColor } }
  type TextStyle = { bgColor: string; textColor: string };
  const [textStyles, setTextStyles] = useState<Record<number, TextStyle>>(
    (userPage?.customData as any)?.textStyles || {}
  );

  useEffect(() => {
    setTextContent((userPage?.textContent as string[]) || []);
    setPhotos((userPage?.photos as string[]) || []);
    setVideoUrl(userPage?.videoUrl || null);
    const data = (userPage?.customData as Record<string, any>) || {};
    const { photoLayouts: layouts, textStyles: styles, ...rest } = data;
    setCustomData(rest);
    setPhotoLayouts(layouts || {});
    setTextStyles(styles || {});
    setIsDirty(false);
  }, [userPage, pageNumber]);

  const handleTextStyleChange = (index: number, style: TextStyle) => {
    setTextStyles(prev => ({ ...prev, [index]: style }));
    setIsDirty(true);
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
      
      // Merge photoLayouts and textStyles into customData for saving
      const dataToSave = {
        ...customData,
        ...(Object.keys(photoLayouts).length > 0 ? { photoLayouts } : {}),
        ...(Object.keys(textStyles).length > 0 ? { textStyles } : {})
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

  const prompts = language === "fr" 
    ? (templatePage?.promptsFr as string[]) || []
    : (templatePage?.promptsEn as string[]) || [];

  const pageType = templatePage?.pageType || "text_photo";
  const maxPhotos = templatePage?.maxPhotos || 1;
  const hasVideo = templatePage?.hasVideo || false;

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
              <PhotoBlock
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
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
              />
            )}
            <CollageBlock
              photos={photos}
              maxPhotos={maxPhotos}
              onAdd={handlePhotoAdd}
              onRemove={handlePhotoRemove}
              language={language}
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
              <PhotoBlock
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
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
            />
            <CollageBlock
              photos={photos}
              maxPhotos={maxPhotos}
              onAdd={handlePhotoAdd}
              onRemove={handlePhotoRemove}
              language={language}
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
              />
            )}
            {maxPhotos > 0 && (
              <PhotoBlock
                photos={photos}
                maxPhotos={maxPhotos}
                onAdd={handlePhotoAdd}
                onRemove={handlePhotoRemove}
                language={language}
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
              <CardTitle className="text-xl font-fraunces">
                {language === "fr" 
                  ? templatePage?.titleFr 
                  : templatePage?.titleEn}
              </CardTitle>
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
            </div>
          </DialogHeader>
          
          <div className="p-6 bg-stone-100 overflow-auto max-h-[calc(95vh-180px)]">
            {/* Book page simulation - 8x11 aspect ratio (8:11 = 0.727) */}
            <div 
              className="mx-auto bg-white shadow-2xl border border-stone-300 relative flex flex-col"
              style={{ 
                width: "min(100%, 440px)", 
                aspectRatio: "8 / 11",
                padding: "clamp(16px, 4%, 32px)"
              }}
              onMouseMove={handlePhotoMouseMove}
              onMouseUp={handlePhotoMouseUp}
              onMouseLeave={handlePhotoMouseUp}
            >
              {/* Page Header */}
              <div className="text-center mb-4 pb-3 border-b border-stone-200">
                <h2 className="text-xl font-serif font-bold text-stone-800">
                  {language === "fr" ? templatePage?.titleFr : templatePage?.titleEn}
                </h2>
                {templatePage?.subtitleFr && (
                  <p className="text-sm text-stone-500 mt-1">
                    {language === "fr" ? templatePage?.subtitleFr : templatePage?.subtitleEn}
                  </p>
                )}
              </div>

              {/* Photos Section - Interactive */}
              {photos.length > 0 && (
                <div className={`mb-4 ${photos.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                  {photos.slice(0, 4).map((photo, idx) => {
                    const layout = getPhotoLayout(idx);
                    const isActive = activePhotoIndex === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`relative bg-stone-100 rounded overflow-hidden cursor-pointer ${
                          photos.length === 1 ? 'aspect-[4/3] max-h-48' : 'aspect-square'
                        } ${isActive ? 'ring-2 ring-sage-500 ring-offset-1' : 'hover:ring-1 hover:ring-stone-300'}`}
                        onClick={() => setActivePhotoIndex(activePhotoIndex === idx ? null : idx)}
                        onMouseDown={(e) => isActive && handlePhotoMouseDown(e, idx)}
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover select-none"
                          draggable={false}
                          style={{
                            transform: `scale(${layout.scale / 100}) translate(${layout.x}%, ${layout.y}%)`,
                            transformOrigin: 'center center'
                          }}
                        />
                        {isActive && (
                          <div className="absolute top-1 right-1 bg-sage-500 text-white rounded-full p-1">
                            <Move className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {photos.length > 4 && (
                    <div className="flex items-center justify-center text-xs text-stone-500 col-span-2">
                      +{photos.length - 4} {language === "fr" ? "autres photos" : "more photos"}
                    </div>
                  )}
                </div>
              )}

              {/* Empty photo placeholder */}
              {photos.length === 0 && (templatePage?.maxPhotos || 0) > 0 && (
                <div className="mb-4 aspect-[4/3] max-h-32 bg-stone-100 rounded border-2 border-dashed border-stone-300 flex items-center justify-center">
                  <div className="text-center text-stone-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">
                      {language === "fr" ? "Ajoutez des photos" : "Add photos"}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Content - Only show user's text with custom background colors */}
              {textContent.length > 0 && textContent.some(t => t && t.trim()) && (
                <div className="space-y-3 text-stone-700">
                  {textContent.map((text, idx) => {
                    if (!text || !text.trim()) return null;
                    const style = textStyles[idx] || { bgColor: "#FFFFFF", textColor: "#374151" };
                    const hasCustomBg = style.bgColor !== "#FFFFFF";
                    return (
                      <p 
                        key={idx} 
                        className={`leading-relaxed ${hasCustomBg ? 'p-3 rounded-lg' : ''}`} 
                        style={{ 
                          fontSize: "12px",
                          backgroundColor: hasCustomBg ? style.bgColor : 'transparent',
                          color: style.textColor
                        }}
                      >
                        {text}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Empty text placeholder - only shown when no content yet */}
              {(!textContent.length || !textContent.some(t => t && t.trim())) && prompts.length > 0 && (
                <div className="p-3 bg-stone-50 rounded border border-dashed border-stone-300">
                  <div className="text-center text-stone-400">
                    <FileText className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">
                      {language === "fr" ? "Contenu en attente" : "Content pending"}
                    </span>
                  </div>
                </div>
              )}

              {/* Custom Data (Birth Info) */}
              {Object.keys(customData).length > 0 && Object.values(customData).some(v => v) && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  {Object.entries(customData).map(([key, value]) => (
                    value ? (
                      <div key={key} className="bg-stone-50 rounded p-2">
                        <p className="text-xs text-stone-500">{key}</p>
                        <p className="font-medium text-stone-800 text-sm">{value}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              )}

              {/* Video indicator */}
              {videoUrl && (
                <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-purple-50 rounded border border-purple-200">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-700">
                    {language === "fr" ? "Vidéo avec code QR" : "Video with QR code"}
                  </span>
                </div>
              )}

              {/* Spacer to push page number to bottom */}
              <div className="flex-1" />

              {/* Page number */}
              <div className="text-center mt-4 pt-2 border-t border-stone-100">
                <span className="text-xs text-stone-400">{pageNumber}</span>
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
