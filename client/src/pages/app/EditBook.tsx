import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Type, Camera, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type EditorMode = "view" | "text" | "photo" | "video";

type ContentItem = {
  type: "text" | "photo" | "video";
  value?: string;
};

type BookPage = {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  description: string;
  content: ContentItem[];
};

export default function EditBook() {
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const pages: BookPage[] = [
    {
      id: 1,
      title: "Bienvenue Léo !",
      subtitle: "12 Janvier 2025",
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
      description: "Le plus beau jour de notre vie. Léo est arrivé pesant 3.4 kg et mesurant 50 cm.",
      content: []
    },
    {
      id: 2,
      title: "Première rencontre",
      subtitle: "27 Novembre 2025",
      image: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=800&auto=format&fit=crop",
      description: "Le moment magique où Léo a rencontré sa petite sœur.",
      content: []
    },
    {
      id: 3,
      title: "Premiers pas",
      subtitle: "15 Octobre 2025",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
      description: "Ça y est! Après des semaines d'attente, ses premiers pas.",
      content: []
    }
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/app">
          <button className="p-2 hover:bg-stone-700 rounded-full transition-colors">
            <ChevronLeft className="text-white" size={24} />
          </button>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <h1 className="text-white font-serif text-xl font-bold">L'histoire de Léo</h1>
      </div>

      {/* Page Counter */}
      <div className="absolute top-4 right-4 z-20">
        <span className="text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1 rounded-full">
          Page {currentPageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* Book Container - Open Book View */}
      <motion.div
        key={currentPageIndex}
        initial={{ opacity: 0, rotateY: 20 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl relative"
      >
        {editorMode === "view" && (
          <div className="grid grid-cols-2 gap-8">
            {/* Left Page */}
            <div className="aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="flex-1 relative bg-stone-100">
                <img
                  src={currentPage.image}
                  alt={currentPage.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 bg-gradient-to-br from-stone-50 to-white">
                <h2 className="text-xl font-serif font-bold text-stone-900">{currentPage.title}</h2>
                <p className="text-xs text-stone-400 mt-1">{currentPage.subtitle}</p>
              </div>
            </div>

            {/* Right Page - Editable Content */}
            <div className="aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col p-8 relative">
              <div className="flex-1 flex flex-col justify-between">
                {/* Content Area */}
                <div className="space-y-4">
                  <div>
                    <p className="text-stone-600 leading-relaxed text-sm mb-6">
                      {currentPage.description}
                    </p>
                  </div>

                  {/* Content Items */}
                  <div className="space-y-3">
                    {currentPage.content.map((item, idx) => (
                      <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                        {item.type === "text" && (
                          <p className="text-sm text-stone-700">{item.value}</p>
                        )}
                        {item.type === "photo" && (
                          <p className="text-xs text-stone-500">📷 Photo ajoutée</p>
                        )}
                        {item.type === "video" && (
                          <p className="text-xs text-stone-500">🎥 Vidéo ajoutée</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Content Buttons */}
                <div className="flex gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditorMode("text")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                    data-testid="button-add-text"
                  >
                    <Type size={18} />
                    <span className="text-sm font-medium">Texte</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditorMode("photo")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground rounded-lg transition-colors"
                    data-testid="button-add-photo"
                  >
                    <Camera size={18} />
                    <span className="text-sm font-medium">Photo</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditorMode("video")}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    data-testid="button-add-video"
                  >
                    <Video size={18} />
                    <span className="text-sm font-medium">Vidéo</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Editor Modal */}
        <AnimatePresence>
          {editorMode === "text" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white rounded-lg shadow-2xl p-8 flex flex-col z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900">Ajouter du texte</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full">
                  <X size={24} className="text-stone-600" />
                </button>
              </div>

              <div className="flex-1 mb-6">
                <textarea
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  placeholder="Écrivez votre texte ici..."
                  className="w-full h-full p-4 border border-stone-200 rounded-lg focus:outline-none focus:border-primary resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeEditor}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Annuler
                </Button>
                <Button
                  onClick={closeEditor}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg"
                  data-testid="button-save-text"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          )}

          {editorMode === "photo" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white rounded-lg shadow-2xl p-8 flex flex-col z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900">Ajouter une photo</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full">
                  <X size={24} className="text-stone-600" />
                </button>
              </div>

              {!selectedPhoto ? (
                <>
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center mb-6 hover:border-primary transition-colors cursor-pointer group"
                  >
                    <Camera size={48} className="text-stone-300 mb-4 group-hover:text-primary transition-colors" />
                    <p className="text-stone-600 font-medium mb-2">Cliquez pour sélectionner une photo</p>
                    <p className="text-xs text-stone-500">ou glissez-déposez une image</p>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setSelectedPhoto(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      data-testid="input-photo-file"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 mb-6 rounded-lg overflow-hidden border border-stone-200">
                    <img
                      src={selectedPhoto}
                      alt="Preview"
                      className="w-full h-full object-contain bg-stone-50"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="mb-6 text-sm text-primary hover:text-primary/80 transition-colors"
                    data-testid="button-change-photo"
                  >
                    Changer la photo
                  </button>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={closeEditor}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Annuler
                </Button>
                <Button
                  onClick={closeEditor}
                  disabled={!selectedPhoto}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                  data-testid="button-save-photo"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          )}

          {editorMode === "video" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white rounded-lg shadow-2xl p-8 flex flex-col z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-stone-900">Ajouter une vidéo</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full">
                  <X size={24} className="text-stone-600" />
                </button>
              </div>

              <div
                onClick={() => videoInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center mb-6 hover:border-primary transition-colors cursor-pointer group"
              >
                <Video size={48} className="text-stone-300 mb-4 group-hover:text-primary transition-colors" />
                <p className="text-stone-600 font-medium mb-2">Cliquez pour sélectionner une vidéo</p>
                <p className="text-xs text-stone-500">ou glissez-déposez un fichier vidéo</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={(e) => {
                    // Handle video upload
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log("Vidéo sélectionnée:", file.name);
                    }
                  }}
                  className="hidden"
                  data-testid="input-video-file"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={closeEditor}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Annuler
                </Button>
                <Button
                  onClick={closeEditor}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg"
                  data-testid="button-save-video"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-8 mt-12">
        <button
          onClick={goToPreviousPage}
          disabled={currentPageIndex === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white border border-white/20"
          data-testid="button-previous-page"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="flex gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPageIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentPageIndex ? "bg-white w-8" : "bg-white/40 w-2"
              }`}
              data-testid={`dot-page-${index}`}
            />
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPageIndex === pages.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white border border-white/20"
          data-testid="button-next-page"
        >
          <ChevronLeft size={28} className="rotate-180" />
        </button>
      </div>
    </div>
  );
}
