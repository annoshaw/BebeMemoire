import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Type, Camera, Video, X, QrCode, Layout, Plus, LayoutTemplate, Sparkles, ImagePlus, Wand2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type EditorMode = "view" | "text" | "photo" | "video" | "qrcode" | "layout";
type LayoutStyle = "auto" | "classic" | "modern" | "elegant" | "playful" | "minimal" | "story";

type ContentItem = {
  type: "text" | "photo" | "video" | "qrcode";
  value?: string;
  videoUrl?: string;
  imageUrl?: string;
};

type BookPage = {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  images: string[];
  layoutStyle: LayoutStyle;
  content: ContentItem[];
};

const sampleImages = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?q=80&w=400&auto=format&fit=crop",
];

const layoutStyles = [
  { id: "auto", name: "Automatique", icon: "✨", desc: "S'adapte au nombre de photos", color: "from-violet-500 to-purple-500" },
  { id: "classic", name: "Classique", icon: "🖼️", desc: "Photo principale + texte élégant", color: "from-amber-500 to-orange-500" },
  { id: "modern", name: "Moderne", icon: "🎨", desc: "Grille dynamique créative", color: "from-blue-500 to-cyan-500" },
  { id: "elegant", name: "Élégant", icon: "💎", desc: "Mise en page raffinée", color: "from-rose-500 to-pink-500" },
  { id: "playful", name: "Ludique", icon: "🎈", desc: "Disposition amusante", color: "from-green-500 to-emerald-500" },
  { id: "minimal", name: "Minimal", icon: "◻️", desc: "Épuré et simple", color: "from-stone-500 to-slate-500" },
  { id: "story", name: "Histoire", icon: "📖", desc: "Narration visuelle", color: "from-indigo-500 to-blue-500" },
];

export default function EditBook() {
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const babyName = typeof window !== "undefined" ? localStorage.getItem("babyName") || "Léo" : "Léo";
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      }
    }
    
    if (newImages.length > 0) {
      const newPages = [...pages];
      newPages[currentPageIndex].images = [...currentPage.images, ...newImages];
      setPages(newPages);
    }
    
    setIsUploading(false);
  };

  const generateQRCodeDataUrl = (text: string) => {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
  };

  const [pages, setPages] = useState<BookPage[]>([
    {
      id: 1,
      title: "BIENVENUE",
      subtitle: `L'ARRIVÉE DE ${babyName.toUpperCase()}`,
      date: "12 / 01 / 2025",
      description: "Un moment inoubliable, gravé à jamais dans nos cœurs.\n\nLe jour où tu es arrivé(e) parmi nous, le monde s'est illuminé d'une lumière nouvelle.",
      images: sampleImages.slice(0, 6),
      layoutStyle: "auto",
      content: []
    },
    {
      id: 2,
      title: "PREMIERS",
      subtitle: "MOMENTS",
      date: "15 / 01 / 2025",
      description: "Ces instants précieux de découverte.\n\nChaque regard, chaque sourire, chaque petit geste devient un trésor que nous chérissons.",
      images: sampleImages.slice(0, 2),
      layoutStyle: "elegant",
      content: []
    },
    {
      id: 3,
      title: "NOTRE",
      subtitle: "FAMILLE",
      date: "20 / 02 / 2025",
      description: "L'amour qui nous unit.\n\nEnsemble, nous créons les plus beaux souvenirs, un jour à la fois.",
      images: sampleImages.slice(0, 4),
      layoutStyle: "modern",
      content: []
    },
    {
      id: 4,
      title: "SOUVENIR",
      subtitle: "D'UN JOUR SPÉCIAL",
      date: "18 / 06 / 2025",
      description: "Un instant simple, en toute intimité, et un week-end rien que pour nous deux afin de célébrer ce moment.\n\nUne parenthèse enchantée où seuls comptaient l'amour et la complicité qui nous unissaient.",
      images: sampleImages.slice(0, 1),
      layoutStyle: "classic",
      content: []
    },
    {
      id: 5,
      title: "GRANDIR",
      subtitle: "ENSEMBLE",
      date: "25 / 03 / 2025",
      description: "Chaque jour apporte son lot de découvertes et de bonheur.",
      images: sampleImages.slice(0, 3),
      layoutStyle: "playful",
      content: []
    },
    {
      id: 6,
      title: "MOMENTS",
      subtitle: "PRÉCIEUX",
      date: "10 / 04 / 2025",
      description: "Ces instants de pure joie qui illuminent notre quotidien.",
      images: sampleImages.slice(0, 5),
      layoutStyle: "story",
      content: []
    }
  ]);

  const currentPage = pages[currentPageIndex];

  const updateLayoutStyle = (style: LayoutStyle) => {
    const newPages = [...pages];
    newPages[currentPageIndex].layoutStyle = style;
    setPages(newPages);
    setShowLayoutPicker(false);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const closeEditor = () => {
    setEditorMode("view");
    setSelectedText("");
  };

  const addNewPage = () => {
    const newPage: BookPage = {
      id: Date.now(),
      title: "NOUVELLE",
      subtitle: "PAGE",
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / '),
      description: "Ajoutez votre texte ici...",
      images: [],
      layoutStyle: "auto",
      content: []
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const getCurrentLayoutName = () => {
    const style = layoutStyles.find(s => s.id === currentPage.layoutStyle);
    return style?.name || "Automatique";
  };

  const renderLayout = (page: BookPage) => {
    const { images, title, subtitle, date, description, layoutStyle } = page;
    const photoCount = images.length;

    if (photoCount === 0) {
      return (
        <div className="w-full h-full bg-white p-8 flex flex-col items-center justify-center" data-testid="layout-empty">
          <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <ImagePlus size={40} className="text-stone-400" />
          </div>
          <p className="text-xs text-stone-400 tracking-widest mb-2" data-testid="text-page-date">{date}</p>
          <h2 className="text-2xl font-serif font-bold text-stone-800 text-center" data-testid="text-page-title">{title}</h2>
          <h3 className="text-xl font-serif text-stone-600 text-center mb-4" data-testid="text-page-subtitle">{subtitle}</h3>
          <p className="text-sm text-stone-500 text-center max-w-xs" data-testid="text-page-description">{description.split('\n')[0]}</p>
          <p className="text-xs text-stone-400 mt-6">Ajoutez des photos pour créer votre mise en page</p>
        </div>
      );
    }

    if (layoutStyle === "classic" || (layoutStyle === "auto" && photoCount === 1)) {
      return (
        <div className="w-full h-full bg-white flex flex-col" data-testid="layout-classic">
          <div className="flex-1 relative">
            <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-main-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-xs tracking-widest mb-2 opacity-80" data-testid="text-page-date">{date}</p>
              <h2 className="text-3xl font-serif font-bold leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-xl font-serif opacity-90" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-stone-600 leading-relaxed" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "elegant" || (layoutStyle === "auto" && photoCount === 2)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-stone-50 to-white p-6 flex flex-col" data-testid="layout-elegant">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-elegant-0" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-elegant-1" />
            </div>
          </div>
          <div className="pt-5 text-center">
            <div className="inline-block px-4 py-1 bg-stone-100 rounded-full mb-2">
              <p className="text-xs text-stone-500 tracking-widest" data-testid="text-page-date">{date}</p>
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-lg font-serif text-stone-500 mb-2" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-sm text-stone-600 italic" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "modern" || (layoutStyle === "auto" && photoCount >= 4)) {
      return (
        <div className="w-full h-full bg-white p-4" data-testid="layout-modern">
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-0" />
            </div>
            <div className="rounded-lg overflow-hidden">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-1" />
            </div>
            <div className="rounded-lg overflow-hidden">
              <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-2" />
            </div>
            <div className="bg-primary/10 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] text-primary tracking-widest mb-1" data-testid="text-page-date">{date}</p>
              <h2 className="text-lg font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg overflow-hidden">
                <img src={images[3] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-3" />
              </div>
              <div className="bg-stone-50 rounded-lg p-3 flex items-center">
                <p className="text-[10px] text-stone-600 leading-relaxed line-clamp-4" data-testid="text-page-description">{description}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === "playful" || (layoutStyle === "auto" && photoCount === 3)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 p-5" data-testid="layout-playful">
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="row-span-2 rounded-3xl overflow-hidden shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-0" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg rotate-[2deg] hover:rotate-0 transition-transform">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-1" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg rotate-[-1deg] hover:rotate-0 transition-transform">
              <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-2" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 rounded-t-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎈</span>
              <p className="text-xs text-rose-500 tracking-widest font-medium" data-testid="text-page-date">{date}</p>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-rose-600" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-xs text-stone-500 mt-1" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "minimal") {
      return (
        <div className="w-full h-full bg-white p-8 flex flex-col" data-testid="layout-minimal">
          <div className="text-center mb-6">
            <p className="text-[10px] text-stone-400 tracking-[0.3em] uppercase" data-testid="text-page-date">{date}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-3/4 aspect-square rounded-sm overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-minimal-0" />
            </div>
          </div>
          <div className="text-center mt-6">
            <h2 className="text-xl font-light tracking-wide text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-light text-stone-400 mt-1" data-testid="text-page-subtitle">{subtitle}</h3>
            <div className="w-8 h-px bg-stone-300 mx-auto my-3" />
            <p className="text-xs text-stone-500 max-w-xs mx-auto" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "story" || (layoutStyle === "auto" && photoCount >= 5)) {
      return (
        <div className="w-full h-full bg-[#f8f6f3] p-4" data-testid="layout-story">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.slice(0, 3).map((img, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-story-${idx}`} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-1 bg-white rounded-lg p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] text-stone-400 tracking-widest mb-1" data-testid="text-page-date">{date}</p>
              <h2 className="text-base font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
            <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm">
              <p className="text-[10px] text-stone-600 leading-relaxed" data-testid="text-page-description">{description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.slice(3, 6).map((img, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
                <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-story-${idx + 3}`} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white p-5 flex flex-col" data-testid="layout-default">
        <div className="flex-1 rounded-xl overflow-hidden">
          <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-default-0" />
        </div>
        <div className="pt-4 text-center">
          <p className="text-xs text-stone-400 tracking-widest" data-testid="text-page-date">{date}</p>
          <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
          <h3 className="text-lg font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
          <p className="text-sm text-stone-500 mt-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/app">
          <button className="p-2 hover:bg-stone-700 rounded-full transition-colors" data-testid="button-back">
            <ChevronLeft className="text-white" size={24} />
          </button>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <h1 className="text-white font-serif text-xl font-bold">L'histoire de {babyName}</h1>
      </div>

      {/* Page Counter & Layout Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button 
          onClick={() => setShowLayoutPicker(true)}
          className="flex items-center gap-2 text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1.5 rounded-full hover:bg-stone-600/50 transition-colors"
          data-testid="button-change-layout"
        >
          <Layout size={14} />
          <span>{getCurrentLayoutName()}</span>
        </button>
        <span className="text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1.5 rounded-full" data-testid="text-page-counter">
          {currentPageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPreviousPage}
        disabled={currentPageIndex === 0}
        className={`absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          currentPageIndex === 0 
            ? "opacity-30 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur"
        }`}
        data-testid="button-prev-page"
      >
        <ChevronLeft className="text-white" size={28} />
      </button>

      <button
        onClick={goToNextPage}
        disabled={currentPageIndex === pages.length - 1}
        className={`absolute right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          currentPageIndex === pages.length - 1 
            ? "opacity-30 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur"
        }`}
        data-testid="button-next-page"
      >
        <ChevronRight className="text-white" size={28} />
      </button>

      {/* Book Page */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPageIndex}-${currentPage.layoutStyle}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg relative"
        >
          <div className="aspect-[3/4] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            {renderLayout(currentPage)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full p-2 shadow-lg">
        <button
          onClick={() => setEditorMode("text")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-text"
        >
          <Type size={18} />
          <span className="text-sm">Texte</span>
        </button>
        <button
          onClick={() => setEditorMode("photo")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-photo"
        >
          <Camera size={18} />
          <span className="text-sm">Photo</span>
        </button>
        <button
          onClick={() => setEditorMode("video")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-video"
        >
          <Video size={18} />
          <span className="text-sm">Vidéo</span>
        </button>
        <button
          onClick={() => setEditorMode("qrcode")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-qrcode"
        >
          <QrCode size={18} />
          <span className="text-sm">QR</span>
        </button>
        <div className="w-px h-6 bg-stone-200 mx-1" />
        <button
          onClick={addNewPage}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
          data-testid="button-add-new-page"
        >
          <Plus size={18} />
          <span className="text-sm">Nouvelle page</span>
        </button>
      </div>

      {/* Layout Picker Modal */}
      <AnimatePresence>
        {showLayoutPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLayoutPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate size={20} className="text-primary" />
                  <h3 className="font-bold text-stone-800" data-testid="text-layout-modal-title">Style de collage</h3>
                </div>
                <button 
                  onClick={() => setShowLayoutPicker(false)}
                  className="p-2 hover:bg-stone-100 rounded-full"
                  data-testid="button-close-layout-modal"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {layoutStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateLayoutStyle(style.id as LayoutStyle)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      currentPage.layoutStyle === style.id 
                        ? "border-primary bg-primary/5" 
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    data-testid={`button-layout-${style.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${currentPage.layoutStyle === style.id ? "text-primary" : "text-stone-700"}`}>
                          {style.name}
                        </p>
                        {style.id === "auto" && (
                          <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">{style.desc}</p>
                    </div>
                    {currentPage.layoutStyle === style.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <p className="text-xs text-stone-500 text-center flex items-center justify-center gap-1">
                  <Wand2 size={12} />
                  Le mode Automatique s'adapte au nombre de photos
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {editorMode === "qrcode" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-qr-modal-title">Générer un QR Code</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-qr-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  URL de la vidéo
                </label>
                <input
                  type="text"
                  value={selectedVideoUrl}
                  onChange={(e) => setSelectedVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                  data-testid="input-qr-url"
                />
              </div>

              {selectedVideoUrl && (
                <div className="flex justify-center mb-6 p-4 bg-stone-50 rounded-lg">
                  <img 
                    src={generateQRCodeDataUrl(selectedVideoUrl)} 
                    alt="QR Code preview" 
                    className="w-40 h-40"
                    data-testid="img-qr-preview"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={closeEditor} variant="outline" className="flex-1" data-testid="button-cancel-qr">
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (selectedVideoUrl) {
                      setSelectedVideoUrl("");
                      closeEditor();
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedVideoUrl}
                  data-testid="button-add-qr"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Editor Modal */}
      <AnimatePresence>
        {editorMode === "text" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-editor-modal-title">Modifier le texte</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-text-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={currentPage.title}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].title = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    data-testid="input-page-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Sous-titre</label>
                  <input
                    type="text"
                    value={currentPage.subtitle}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].subtitle = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    data-testid="input-page-subtitle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Date</label>
                  <input
                    type="text"
                    value={currentPage.date}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].date = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    placeholder="JJ / MM / AAAA"
                    data-testid="input-page-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
                  <textarea
                    value={currentPage.description}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].description = e.target.value;
                      setPages(newPages);
                    }}
                    rows={4}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm resize-none"
                    placeholder="Racontez votre histoire..."
                    data-testid="input-page-description"
                  />
                </div>
              </div>

              <Button onClick={closeEditor} className="w-full" data-testid="button-save-text">
                Enregistrer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {editorMode === "photo" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-photo-modal-title">Gérer les photos</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-photo-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700">Photos actuelles</span>
                  <span className="text-xs text-primary font-medium">{currentPage.images.length} photo(s)</span>
                </div>
                <p className="text-xs text-stone-500">
                  {currentPage.layoutStyle === "auto" 
                    ? "La mise en page s'adapte automatiquement au nombre de photos"
                    : `Style actuel: ${getCurrentLayoutName()}`}
                </p>
              </div>

              {currentPage.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {currentPage.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group" data-testid={`img-thumbnail-${idx}`}>
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => {
                          const newPages = [...pages];
                          newPages[currentPageIndex].images = currentPage.images.filter((_, i) => i !== idx);
                          setPages(newPages);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
                  data-testid="button-take-photo"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Camera size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Prendre une photo</p>
                    <p className="text-xs text-stone-400 mt-1">Ouvrir l'appareil photo</p>
                  </div>
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  data-testid="button-gallery"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <ImageIcon size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Galerie</p>
                    <p className="text-xs text-stone-400 mt-1">Choisir une photo existante</p>
                  </div>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-camera"
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-gallery"
              />

              {isUploading && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Ajout en cours...</span>
                </div>
              )}

              <Button onClick={closeEditor} className="w-full" data-testid="button-finish-photo">
                Terminer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Upload Modal */}
      <AnimatePresence>
        {editorMode === "video" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-video-modal-title">Ajouter une vidéo</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-video-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center mb-4 hover:border-red-400 transition-colors cursor-pointer" data-testid="dropzone-video">
                <Video size={40} className="mx-auto text-stone-400 mb-3" />
                <p className="text-sm text-stone-600">Cliquer pour ajouter une vidéo</p>
                <p className="text-xs text-stone-400 mt-1">MP4, MOV jusqu'à 500 Mo</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  data-testid="input-video-file"
                />
              </div>

              <p className="text-xs text-stone-500 text-center mb-4" data-testid="text-video-info">
                La vidéo sera convertie en QR code pour l'impression du livre
              </p>

              <Button onClick={closeEditor} className="w-full" data-testid="button-finish-video">
                Terminer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
