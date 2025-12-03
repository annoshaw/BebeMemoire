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

  useEffect(() => {
    setTextContent((userPage?.textContent as string[]) || []);
    setPhotos((userPage?.photos as string[]) || []);
    setVideoUrl(userPage?.videoUrl || null);
    const data = (userPage?.customData as Record<string, any>) || {};
    const { photoLayouts: layouts, ...rest } = data;
    setCustomData(rest);
    setPhotoLayouts(layouts || {});
    setIsDirty(false);
  }, [userPage, pageNumber]);

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
      
      // Merge photoLayouts into customData for saving
      const dataToSave = {
        ...customData,
        ...(Object.keys(photoLayouts).length > 0 ? { photoLayouts } : {})
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b bg-stone-50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-fraunces">
                  {language === "fr" ? "Aperçu de la page" : "Page Preview"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {language === "fr" 
                    ? "Cliquez sur une photo pour ajuster sa taille et son positionnement"
                    : "Click on a photo to adjust its size and position"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-stone-100 overflow-auto max-h-[calc(95vh-140px)]">
            {/* Book page simulation - 8x11 aspect ratio */}
            <div 
              className="mx-auto bg-white shadow-2xl border border-stone-300 relative flex flex-col flex-shrink-0"
              style={{ 
                width: "min(100%, 380px)", 
                aspectRatio: "8 / 11",
                padding: "clamp(12px, 3%, 24px)"
              }}
              onMouseMove={handlePhotoMouseMove}
              onMouseUp={handlePhotoMouseUp}
              onMouseLeave={handlePhotoMouseUp}
            >
              {/* Page Header */}
              <div className="text-center mb-3 pb-2 border-b border-stone-200">
                <h2 className="text-lg font-serif font-bold text-stone-800">
                  {language === "fr" ? templatePage?.titleFr : templatePage?.titleEn}
                </h2>
                {templatePage?.subtitleFr && (
                  <p className="text-xs text-stone-500 mt-1">
                    {language === "fr" ? templatePage?.subtitleFr : templatePage?.subtitleEn}
                  </p>
                )}
              </div>

              {/* Photos Section - Interactive */}
              {photos.length > 0 && (
                <div className={`mb-3 ${photos.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                  {photos.slice(0, 4).map((photo, idx) => {
                    const layout = getPhotoLayout(idx);
                    const isActive = activePhotoIndex === idx;
                    return (
                      <div 
                        key={idx} 
                        className={`relative bg-stone-100 rounded overflow-hidden cursor-move ${
                          photos.length === 1 ? 'aspect-[4/3] max-h-40' : 'aspect-square'
                        } ${isActive ? 'ring-2 ring-sage-500 ring-offset-1' : ''}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        onMouseDown={(e) => handlePhotoMouseDown(e, idx)}
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
                <div className="mb-3 aspect-[4/3] max-h-28 bg-stone-100 rounded border-2 border-dashed border-stone-300 flex items-center justify-center">
                  <div className="text-center text-stone-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">
                      {language === "fr" ? "Ajoutez des photos" : "Add photos"}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Content - Only show user's text, not the prompts */}
              {textContent.length > 0 && textContent.some(t => t && t.trim()) && (
                <div className="space-y-4 text-stone-700">
                  {textContent.map((text, idx) => (
                    text && text.trim() ? (
                      <p key={idx} className="text-stone-800 leading-relaxed" style={{ fontSize: "12px" }}>{text}</p>
                    ) : null
                  ))}
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

            {/* Photo Controls Panel */}
            {photos.length > 0 && (
              <div className="w-full md:w-64 bg-white rounded-lg border border-stone-200 p-4 flex-shrink-0">
                <h3 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  {language === "fr" ? "Ajuster les photos" : "Adjust Photos"}
                </h3>
                
                {activePhotoIndex !== null && photos[activePhotoIndex] ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-stone-50 rounded">
                      <img 
                        src={photos[activePhotoIndex]} 
                        alt="Selected" 
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="text-sm text-stone-600">
                        Photo {activePhotoIndex + 1}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-stone-600">
                          {language === "fr" ? "Zoom" : "Zoom"}
                        </label>
                        <span className="text-xs text-stone-500">
                          {getPhotoLayout(activePhotoIndex).scale}%
                        </span>
                      </div>
                      <Slider
                        value={[getPhotoLayout(activePhotoIndex).scale]}
                        onValueChange={([value]) => updatePhotoLayout(activePhotoIndex, { scale: value })}
                        min={50}
                        max={200}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
                      <Move className="w-3 h-3 inline mr-1" />
                      {language === "fr" 
                        ? "Glissez la photo pour ajuster sa position"
                        : "Drag the photo to adjust its position"}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetPhotoLayout(activePhotoIndex)}
                      className="w-full"
                    >
                      <RotateCcw className="w-3 h-3 mr-2" />
                      {language === "fr" ? "Réinitialiser" : "Reset"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 text-center py-4">
                    {language === "fr" 
                      ? "Cliquez sur une photo pour l'ajuster"
                      : "Click on a photo to adjust it"}
                  </p>
                )}

                {/* Photo thumbnails for quick selection */}
                {photos.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <p className="text-xs text-stone-500 mb-2">
                      {language === "fr" ? "Sélectionner une photo:" : "Select a photo:"}
                    </p>
                    <div className="grid grid-cols-4 gap-1">
                      {photos.slice(0, 4).map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`aspect-square rounded overflow-hidden border-2 ${
                            activePhotoIndex === idx 
                              ? 'border-sage-500' 
                              : 'border-transparent hover:border-stone-300'
                          }`}
                        >
                          <img 
                            src={photo} 
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white flex justify-between items-center">
            <p className="text-xs text-stone-500">
              {isDirty && (
                <span className="text-amber-600">
                  {language === "fr" ? "Modifications non sauvegardées" : "Unsaved changes"}
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
