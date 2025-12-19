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
  Palette,
  Grid,
  HelpCircle,
  MousePointer2
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
import { PrintPreview } from "./PrintPreview";
import { LayoutSelector } from "./LayoutSelector";
import type { TemplatePage, UserBookPage } from "@shared/schema";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import Draggable from "react-draggable";
import "./BookPageLayout.css";
import "./CollageBlock.css";
import { 
  PREVIEW_DIMS, 
  HEADER_ZONE, 
  IMAGE_ZONE, 
  TEXT_ZONE, 
  FOOTER_ZONE, 
  QR_ZONE,
  TYPOGRAPHY,
  getLayoutForPhotoCount,
  getAvailableLayouts,
  generateCollageZones,
  type PhotoLayout
} from "@/utils/layoutEngine";

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
  displayPageNumber?: number; // Sequential display number for born/adoption books
  templatePage: TemplatePage | null;
  userPage: UserBookPage | null;
  language: "fr" | "en";
  onBack: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const PAGE_EDITOR_TUTORIAL_KEY = "memoria_page_editor_tutorial_seen";

interface EditorTutorialStep {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  highlightArea?: "title-style" | "text-style" | "photos" | "save";
}

const editorTutorialSteps: EditorTutorialStep[] = [
  {
    id: "welcome",
    titleFr: "Personnalisez votre page !",
    titleEn: "Customize your page!",
    descriptionFr: "Vous pouvez modifier le style du titre, du texte et ajouter des photos. Voici comment faire !",
    descriptionEn: "You can customize the title style, text, and add photos. Here's how!",
  },
  {
    id: "title-style",
    titleFr: "Style du titre",
    titleEn: "Title Style",
    descriptionFr: "Cliquez sur les icônes à côté du titre pour changer la police (Aa) et la taille (A↕) du titre de votre page.",
    descriptionEn: "Click the icons next to the title to change the font (Aa) and size (A↕) of your page title.",
    highlightArea: "title-style",
  },
  {
    id: "text-style",
    titleFr: "Style du texte",
    titleEn: "Text Style",
    descriptionFr: "Dans la zone de texte, cliquez sur les icônes pour changer la couleur du fond, la couleur du texte, la police et la taille.",
    descriptionEn: "In the text area, click the icons to change background color, text color, font, and size.",
    highlightArea: "text-style",
  },
  {
    id: "photos",
    titleFr: "Ajoutez vos photos",
    titleEn: "Add your photos",
    descriptionFr: "Cliquez sur la zone photo pour ajouter vos images. Vous pouvez en ajouter plusieurs et choisir différentes dispositions !",
    descriptionEn: "Click on the photo area to add your images. You can add multiple photos and choose different layouts!",
    highlightArea: "photos",
  },
  {
    id: "save",
    titleFr: "N'oubliez pas de sauvegarder !",
    titleEn: "Don't forget to save!",
    descriptionFr: "Quand vous avez terminé, cliquez sur le bouton vert 'Sauvegarder' pour enregistrer vos modifications.",
    descriptionEn: "When you're done, click the green 'Save' button to save your changes.",
    highlightArea: "save",
  },
];

export function PageEditor({
  bookId,
  pageNumber,
  displayPageNumber,
  templatePage,
  userPage,
  language,
  onBack,
  onNavigate,
  hasNext,
  hasPrev,
}: PageEditorProps) {
  // Use displayPageNumber for UI, fallback to pageNumber if not provided
  const shownPageNumber = displayPageNumber ?? pageNumber;
  const queryClient = useQueryClient();

  // Editor tutorial state
  const [showEditorTutorial, setShowEditorTutorial] = useState(false);
  const [editorTutorialStep, setEditorTutorialStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(PAGE_EDITOR_TUTORIAL_KEY);
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setShowEditorTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeEditorTutorial = () => {
    setShowEditorTutorial(false);
    localStorage.setItem(PAGE_EDITOR_TUTORIAL_KEY, "true");
  };

  const nextEditorTutorialStep = () => {
    if (editorTutorialStep < editorTutorialSteps.length - 1) {
      setEditorTutorialStep(editorTutorialStep + 1);
    } else {
      closeEditorTutorial();
    }
  };

  const prevEditorTutorialStep = () => {
    if (editorTutorialStep > 0) {
      setEditorTutorialStep(editorTutorialStep - 1);
    }
  };

  const resetEditorTutorial = () => {
    setEditorTutorialStep(0);
    setShowEditorTutorial(true);
  };

  const currentEditorStep = editorTutorialSteps[editorTutorialStep];

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
  const [selectedPhotoLayoutId, setSelectedPhotoLayoutId] = useState<string | undefined>(
    (userPage?.customData as any)?.selectedPhotoLayoutId
  );

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
    const { photoLayouts: layouts, textStyles: styles, titleStyle: tStyle, blockPositions: positions, textLayout: tLayout, selectedPhotoLayoutId: layoutId, ...rest } = data;
    setCustomData(rest);
    setPhotoLayouts(layouts || {});
    setTextStyles(styles || {});
    setTitleStyle(tStyle || { fontFamily: "'Fraunces', serif", fontSize: 20 });
    setTextLayout(tLayout || { position: 'bottom', textSize: 25 });
    setBlockPositions(positions || {});
    setSelectedPhotoLayoutId(layoutId);
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

  const handleLayoutChange = (layoutId: string) => {
    setSelectedPhotoLayoutId(layoutId);
    setIsDirty(true);
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
      
      // Merge photoLayouts, textStyles, titleStyle, textLayout, blockPositions and selectedPhotoLayoutId into customData for saving
      const dataToSave = {
        ...customData,
        ...(Object.keys(photoLayouts).length > 0 ? { photoLayouts } : {}),
        ...(Object.keys(textStyles).length > 0 ? { textStyles } : {}),
        ...(Object.keys(blockPositions).length > 0 ? { blockPositions } : {}),
        ...(selectedPhotoLayoutId ? { selectedPhotoLayoutId } : {}),
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
      console.log('Uploading video via proxy...', { filename: file.name, size: file.size });
      
      const response = await fetch('/api/media/proxy-upload', {
        method: 'POST',
        headers: { 
          'Content-Type': file.type,
          'X-Book-Id': bookId,
          'X-Page-Id': userPage?.id || '',
          'X-Filename': file.name,
          'X-Media-Type': 'video'
        },
        credentials: 'include',
        body: file
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du téléversement');
      }

      const { mediaId, downloadUrl } = await response.json();
      console.log('Video upload successful!', { mediaId });
      
      setVideoUrl(downloadUrl);
      setVideoMediaId(mediaId);
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
    <div className="space-y-6 relative">
      {/* Editor Tutorial Overlay */}
      {showEditorTutorial && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeEditorTutorial} />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10">
            <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 max-w-[320px] sm:max-w-sm relative animate-in fade-in zoom-in-95 duration-300">
              <button 
                onClick={closeEditorTutorial}
                className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="editor-tutorial-close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {currentEditorStep.highlightArea && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <div className="bg-green-500 text-white p-2 rounded-full animate-bounce">
                    <MousePointer2 className="w-5 h-5" />
                  </div>
                </div>
              )}

              <div className="flex gap-1.5 mb-4">
                {editorTutorialSteps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === editorTutorialStep 
                        ? "w-6 bg-green-500" 
                        : idx < editorTutorialStep 
                          ? "w-3 bg-green-300" 
                          : "w-3 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <h3 className="text-lg font-bold text-sage-900 mb-2 pr-6">
                {language === "fr" ? currentEditorStep.titleFr : currentEditorStep.titleEn}
              </h3>
              <p className="text-sage-600 text-sm leading-relaxed mb-5">
                {language === "fr" ? currentEditorStep.descriptionFr : currentEditorStep.descriptionEn}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={closeEditorTutorial}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  data-testid="editor-tutorial-skip"
                >
                  {language === "fr" ? "Passer" : "Skip"}
                </button>
                <div className="flex gap-2">
                  {editorTutorialStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevEditorTutorialStep}
                      data-testid="editor-tutorial-prev"
                    >
                      {language === "fr" ? "Précédent" : "Previous"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextEditorTutorialStep}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    data-testid="editor-tutorial-next"
                  >
                    {editorTutorialStep === editorTutorialSteps.length - 1 
                      ? (language === "fr" ? "C'est parti !" : "Let's go!")
                      : (language === "fr" ? "Suivant" : "Next")
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Highlight specific areas based on current step - responsive positioning */}
          {currentEditorStep.highlightArea === "title-style" && (
            <div className="absolute top-[140px] sm:top-[160px] left-4 right-4 sm:left-[10%] sm:right-[10%] h-[60px] border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
          )}
          {currentEditorStep.highlightArea === "text-style" && (
            <div className="absolute top-[220px] sm:top-[280px] left-4 right-4 sm:left-[5%] sm:right-[5%] h-[120px] sm:h-[150px] border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
          )}
          {currentEditorStep.highlightArea === "photos" && (
            <div className="absolute top-[350px] sm:top-[450px] left-4 right-4 sm:left-[5%] sm:right-[5%] h-[150px] sm:h-[200px] border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
          )}
          {currentEditorStep.highlightArea === "save" && (
            <div className="absolute bottom-[80px] sm:bottom-[100px] left-4 right-4 sm:left-auto sm:right-4 sm:w-[200px] h-[50px] border-4 border-green-400 rounded-xl pointer-events-none animate-pulse" />
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={onBack}
            data-testid="back-to-parts"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {language === "fr" ? "Retour" : "Back"}
          </Button>
          <button
            onClick={resetEditorTutorial}
            className="p-2 hover:bg-green-50 rounded-full transition-colors group"
            title={language === "fr" ? "Voir le guide" : "View guide"}
            data-testid="button-show-editor-tutorial"
          >
            <HelpCircle className="w-5 h-5 text-green-500 group-hover:text-green-600" />
          </button>
        </div>

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
            {language === "fr" ? "Page" : "Page"} {shownPageNumber}
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
        <CardHeader className="pb-3 px-3 sm:px-6">
          {/* Single horizontal row: Title + icons + badges */}
          <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
            {/* Page badge */}
            <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0 bg-white">
              P{shownPageNumber}
            </Badge>
            {userPage?.isCompleted && (
              <Badge className="bg-green-500 text-[10px] px-1 py-0 flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </Badge>
            )}
            
            {/* Title - truncate on mobile */}
            <CardTitle 
              className="text-xs sm:text-lg leading-tight flex-1 min-w-0 truncate" 
              style={{ fontFamily: titleStyle.fontFamily }}
            >
              {language === "fr" 
                ? templatePage?.titleFr 
                : templatePage?.titleEn}
            </CardTitle>
            
            {/* Controls group - always stay on same line */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Title Font Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                    <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-white shadow-lg border border-stone-200" align="end">
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
                  <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                    <ALargeSmall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3 bg-white shadow-lg border border-stone-200" align="end">
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
              
              {/* Apply to all button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 sm:h-7 text-[9px] sm:text-[10px] px-1.5 sm:px-2 whitespace-nowrap bg-white"
                onClick={() => applyStyleToAllPages('title')}
                disabled={applyingStyle}
              >
                {language === "fr" ? "Tous" : "All"}
              </Button>
            </div>
          </div>
          
          {/* Subtitle/inspiration - second row if exists */}
          {templatePage?.subtitleFr && (
            <p className="text-xs text-stone-500 mt-2">
              {language === "fr" 
                ? templatePage?.subtitleFr 
                : templatePage?.subtitleEn}
            </p>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {renderPageContent()}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 sticky bottom-4 bg-cream-50/90 backdrop-blur-sm py-3 px-2 -mx-2 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
          data-testid="preview-page"
          className="text-xs sm:text-sm"
        >
          <Eye className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{language === "fr" ? "Aperçu" : "Preview"}</span>
          <span className="sm:hidden">{language === "fr" ? "Voir" : "View"}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="bg-[#ead5c8] text-xs sm:text-sm"
          onClick={() => saveMutation.mutate()}
          disabled={isSaving || !isDirty}
          data-testid="save-page"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">{language === "fr" ? "Sauvegarder" : "Save"}</span>
        </Button>

        {!userPage?.isCompleted && (
          <Button
            size="sm"
            onClick={() => completeMutation.mutate()}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            data-testid="complete-page"
          >
            {completeMutation.isPending ? (
              <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{language === "fr" ? "Marquer comme complété" : "Mark as complete"}</span>
            <span className="sm:hidden">{language === "fr" ? "Terminer" : "Done"}</span>
          </Button>
        )}
      </div>

      {/* Page Preview Modal - 8x11 Book Format */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[98vw] max-w-4xl h-[95dvh] sm:h-auto sm:max-h-[95vh] p-0 flex flex-col overflow-hidden">
          {/* Fixed Header */}
          <DialogHeader className="p-3 border-b bg-stone-50 flex-shrink-0">
            <DialogTitle className="text-base font-fraunces mb-2">
              {language === "fr" ? "Aperçu de la page" : "Page Preview"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {language === "fr" 
                ? "Aperçu de votre page de livre"
                : "Preview of your book page"}
            </DialogDescription>
            
            {/* Control buttons - scrollable horizontally on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {/* Text Layout Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 text-xs flex-shrink-0">
                    <FileText className="w-4 h-4 mr-1.5" />
                    {language === "fr" ? "Texte" : "Text"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-[#ffffff] text-center" align="start">
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

              {/* Photo Layout Selector */}
              {photos.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3 text-xs flex-shrink-0">
                      <Grid className="w-4 h-4 mr-1.5" />
                      {language === "fr" ? "Photos" : "Photos"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-[#ffffff]" align="start">
                    <LayoutSelector
                      photoCount={photos.length}
                      selectedLayoutId={selectedPhotoLayoutId}
                      onLayoutChange={handleLayoutChange}
                      language={language}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="h-9 px-3 text-xs flex-shrink-0"
              >
                <Move className="w-4 h-4 mr-1.5" />
                {editMode 
                  ? (language === "fr" ? "Aperçu" : "Preview")
                  : (language === "fr" ? "Déplacer" : "Move")}
              </Button>
            </div>
          </DialogHeader>
          
          {/* Scrollable preview area */}
          <div className="flex-1 overflow-auto bg-stone-100 p-3 sm:p-4">
            <div className="flex justify-center items-start min-h-full">
              {/* Book page 8x11 - responsive with aspect ratio */}
              <div 
                className="bg-white shadow-2xl border border-stone-300 w-full max-w-[400px]"
                style={{
                  aspectRatio: '8 / 11',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(8px, 3vw, 16px)',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
              onMouseMove={handlePhotoMouseMove}
              onMouseUp={handlePhotoMouseUp}
              onMouseLeave={handlePhotoMouseUp}
            >
              {/* Header */}
              <div 
                className="text-center border-b border-stone-200 pb-1"
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

                const renderPhotosGrid = () => {
                  if (photos.length > 0) {
                    const currentLayout = getLayoutForPhotoCount(photos.length, selectedPhotoLayoutId);
                    const photoZones = (photos.length <= currentLayout.zones.length)
                      ? currentLayout.zones.slice(0, photos.length)
                      : generateCollageZones(photos.length);
                    
                    return (
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        {collageStyle === "monthHero" && monthNumber !== undefined && (
                          <div style={{
                            position: 'absolute',
                            left: 10,
                            top: 10,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            width: 45,
                            height: 45,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 10,
                          }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#4a5568' }}>{monthNumber}</span>
                            <span style={{ fontSize: '7px', color: '#718096' }}>{language === "fr" ? "mois" : "mo"}</span>
                          </div>
                        )}
                        {photos.map((photo, index) => {
                          const zone = photoZones[index];
                          if (!zone) return null;
                          
                          const leftPct = ((zone.x - IMAGE_ZONE.x) / IMAGE_ZONE.width) * 100;
                          const topPct = ((zone.y - IMAGE_ZONE.y) / IMAGE_ZONE.height) * 100;
                          const widthPct = (zone.width / IMAGE_ZONE.width) * 100;
                          const heightPct = (zone.height / IMAGE_ZONE.height) * 100;
                          
                          return (
                            <div
                              key={index}
                              style={{
                                position: 'absolute',
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                width: `${widthPct}%`,
                                height: `${heightPct}%`,
                                overflow: 'hidden',
                                borderRadius: '6px',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                              }}
                            >
                              <img 
                                src={photo} 
                                alt={`Photo ${index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  objectPosition: 'center center'
                                }}
                              />
                            </div>
                          );
                        })}
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
                    <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', display: 'grid', gridTemplateRows: hasText ? `${textSizePercent}% 1fr` : '1fr', gap: '5px', overflow: 'hidden' }}>
                      {hasText && <div style={{ overflow: 'auto', borderBottom: '1px solid #e5e5e5' }}>{renderTextBlock()}</div>}
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                    </div>
                  );
                }

                if (layoutPosition === 'bottom') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', display: 'grid', gridTemplateRows: hasText ? `1fr ${textSizePercent}%` : '1fr', gap: '5px', overflow: 'hidden' }}>
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                      {hasText && <div style={{ overflow: 'auto', borderTop: '1px solid #e5e5e5' }}>{renderTextBlock()}</div>}
                    </div>
                  );
                }

                if (layoutPosition === 'left') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', display: 'grid', gridTemplateColumns: hasText ? `${textSizePercent}% 1fr` : '1fr', gap: '5px', overflow: 'hidden' }}>
                      {hasText && <div style={{ overflow: 'auto', borderRight: '1px solid #e5e5e5', paddingRight: '5px' }}>{renderTextBlock()}</div>}
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                    </div>
                  );
                }

                if (layoutPosition === 'right') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', display: 'grid', gridTemplateColumns: hasText ? `1fr ${textSizePercent}%` : '1fr', gap: '5px', overflow: 'hidden' }}>
                      <div style={{ minHeight: 0, overflow: 'hidden' }}>{renderPhotosGrid()}</div>
                      {hasText && <div style={{ overflow: 'auto', borderLeft: '1px solid #e5e5e5', paddingLeft: '5px' }}>{renderTextBlock()}</div>}
                    </div>
                  );
                }

                if (layoutPosition === 'center') {
                  return (
                    <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', position: 'relative', overflow: 'hidden' }}>
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
                  <div style={{ flex: 1, minHeight: 0, marginTop: '5px', marginBottom: '5px', display: 'grid', gridTemplateRows: hasText ? '1fr 25%' : '1fr', gap: '5px', overflow: 'hidden' }}>
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
                  <span className="text-[10px] text-stone-400">{shownPageNumber}</span>
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
