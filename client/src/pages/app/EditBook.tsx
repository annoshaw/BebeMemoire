import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Type, Camera, Video, X, QrCode as QrCodeIcon, Layout, Plus, Grid3X3, LayoutTemplate, Sparkles, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type EditorMode = "view" | "text" | "photo" | "video" | "qrcode" | "layout";

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

export default function EditBook() {
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const babyName = typeof window !== "undefined" ? localStorage.getItem("babyName") || "Léo" : "Léo";
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

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
      content: []
    },
    {
      id: 2,
      title: "PREMIERS",
      subtitle: "MOMENTS",
      date: "15 / 01 / 2025",
      description: "Ces instants précieux de découverte.\n\nChaque regard, chaque sourire, chaque petit geste devient un trésor que nous chérissons.",
      images: sampleImages.slice(0, 2),
      content: []
    },
    {
      id: 3,
      title: "NOTRE",
      subtitle: "FAMILLE",
      date: "20 / 02 / 2025",
      description: "L'amour qui nous unit.\n\nEnsemble, nous créons les plus beaux souvenirs, un jour à la fois.",
      images: sampleImages.slice(0, 4),
      content: []
    },
    {
      id: 4,
      title: "SOUVENIR",
      subtitle: "D'UN JOUR SPÉCIAL",
      date: "18 / 06 / 2025",
      description: "Un instant simple, en toute intimité, et un week-end rien que pour nous deux afin de célébrer ce moment.\n\nUne parenthèse enchantée où seuls comptaient l'amour et la complicité qui nous unissaient.",
      images: sampleImages.slice(0, 1),
      content: []
    },
    {
      id: 5,
      title: "GRANDIR",
      subtitle: "ENSEMBLE",
      date: "25 / 03 / 2025",
      description: "Chaque jour apporte son lot de découvertes et de bonheur.",
      images: sampleImages.slice(0, 3),
      content: []
    },
    {
      id: 6,
      title: "MOMENTS",
      subtitle: "PRÉCIEUX",
      date: "10 / 04 / 2025",
      description: "Ces instants de pure joie qui illuminent notre quotidien.",
      images: sampleImages.slice(0, 5),
      content: []
    }
  ]);

  const currentPage = pages[currentPageIndex];

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

  const getLayoutName = (photoCount: number) => {
    if (photoCount === 0) return "Vide";
    if (photoCount === 1) return "Solo";
    if (photoCount === 2) return "Duo";
    if (photoCount === 3) return "Trio";
    if (photoCount === 4) return "Quatuor";
    if (photoCount === 5) return "Mosaïque";
    return "Collage";
  };

  const renderAdaptiveLayout = (page: BookPage) => {
    const { images, title, subtitle, date, description } = page;
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

    if (photoCount === 1) {
      return (
        <div className="w-full h-full bg-white flex flex-col" data-testid="layout-solo">
          <div className="flex-1 relative">
            <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-solo-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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

    if (photoCount === 2) {
      return (
        <div className="w-full h-full bg-white p-5 flex flex-col" data-testid="layout-duo">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-duo-0" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-duo-1" />
            </div>
          </div>
          <div className="pt-4 text-center">
            <p className="text-xs text-stone-400 tracking-widest mb-1" data-testid="text-page-date">{date}</p>
            <h2 className="text-2xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-lg font-serif text-stone-600 mb-2" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-sm text-stone-600" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (photoCount === 3) {
      return (
        <div className="w-full h-full bg-white p-5" data-testid="layout-trio">
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="row-span-2 rounded-xl overflow-hidden shadow-md">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-trio-0" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-trio-1" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={images[2]} className="w-full h-full object-cover" alt="" data-testid="img-trio-2" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent p-5">
            <p className="text-[10px] text-stone-400 tracking-widest" data-testid="text-page-date">{date}</p>
            <h2 className="text-lg font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-xs text-stone-500 mt-1 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (photoCount === 4) {
      return (
        <div className="w-full h-full bg-white p-5 flex flex-col" data-testid="layout-quatuor">
          <div className="text-center mb-3">
            <p className="text-xs text-stone-400 tracking-widest" data-testid="text-page-date">{date}</p>
            <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-lg font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {images.slice(0, 4).map((img, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden shadow-md">
                <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-quatuor-${idx}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-500 text-center mt-3 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
        </div>
      );
    }

    if (photoCount === 5) {
      return (
        <div className="w-full h-full bg-white p-4" data-testid="layout-mosaique">
          <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full">
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-md">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaique-0" />
            </div>
            <div className="rounded-lg overflow-hidden shadow-sm">
              <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-mosaique-1" />
            </div>
            <div className="rounded-lg overflow-hidden shadow-sm">
              <img src={images[2]} className="w-full h-full object-cover" alt="" data-testid="img-mosaique-2" />
            </div>
            <div className="rounded-lg overflow-hidden shadow-sm">
              <img src={images[3]} className="w-full h-full object-cover" alt="" data-testid="img-mosaique-3" />
            </div>
            <div className="col-span-2 bg-stone-50 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] text-stone-400 tracking-widest mb-1" data-testid="text-page-date">{date}</p>
              <h2 className="text-lg font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
              <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
              <p className="text-[10px] text-stone-500 mt-1 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 w-20 h-20 rounded-lg overflow-hidden shadow-md">
            <img src={images[4]} className="w-full h-full object-cover" alt="" data-testid="img-mosaique-4" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#faf9f7] p-4" data-testid="layout-collage">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="aspect-square rounded-lg overflow-hidden shadow-sm">
            <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-collage-0" />
          </div>
          <div className="aspect-[4/3] col-span-2 rounded-lg overflow-hidden shadow-sm">
            <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-collage-1" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="col-span-1 bg-white rounded-lg p-3 flex flex-col justify-center">
            <p className="text-[10px] text-stone-400 tracking-widest mb-1" data-testid="text-page-date">{date}</p>
            <h2 className="text-sm font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
          </div>
          <div className="col-span-2 bg-white rounded-lg p-3">
            <p className="text-[10px] text-stone-600 leading-relaxed line-clamp-4" data-testid="text-page-description">{description}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {images.slice(2, 6).map((img, idx) => (
            <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-sm">
              <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-collage-${idx + 2}`} />
            </div>
          ))}
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

      {/* Page Counter & Layout Info */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1 rounded-full" data-testid="text-layout-info">
          <Camera size={14} />
          {currentPage.images.length} photos · {getLayoutName(currentPage.images.length)}
        </span>
        <span className="text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1 rounded-full" data-testid="text-page-counter">
          Page {currentPageIndex + 1} / {pages.length}
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
          key={currentPageIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg relative"
        >
          <div className="aspect-[3/4] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            {renderAdaptiveLayout(currentPage)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full p-2">
        <button
          onClick={() => setEditorMode("text")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/20 text-white transition-colors"
          data-testid="button-add-text"
        >
          <Type size={18} />
          <span className="text-sm">Texte</span>
        </button>
        <button
          onClick={() => setEditorMode("photo")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/20 text-white transition-colors"
          data-testid="button-add-photo"
        >
          <Camera size={18} />
          <span className="text-sm">Photo</span>
        </button>
        <button
          onClick={() => setEditorMode("video")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/20 text-white transition-colors"
          data-testid="button-add-video"
        >
          <Video size={18} />
          <span className="text-sm">Vidéo</span>
        </button>
        <button
          onClick={() => setEditorMode("qrcode")}
          className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/20 text-white transition-colors"
          data-testid="button-add-qrcode"
        >
          <QrCodeIcon size={18} />
          <span className="text-sm">QR</span>
        </button>
      </div>

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
                  La mise en page s'adapte automatiquement au nombre de photos
                </p>
              </div>

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
                <button
                  onClick={() => {
                    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    const newPages = [...pages];
                    newPages[currentPageIndex].images = [...currentPage.images, randomImg];
                    setPages(newPages);
                  }}
                  className="aspect-square rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                  data-testid="button-add-sample-photo"
                >
                  <Plus size={24} className="text-stone-400" />
                </button>
              </div>

              <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center mb-4 hover:border-primary transition-colors cursor-pointer" data-testid="dropzone-photo">
                <Camera size={32} className="mx-auto text-stone-400 mb-2" />
                <p className="text-sm text-stone-600">Cliquer pour ajouter des photos</p>
                <p className="text-xs text-stone-400 mt-1">JPG, PNG jusqu'à 10 Mo</p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  data-testid="input-photo-file"
                />
              </div>

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
