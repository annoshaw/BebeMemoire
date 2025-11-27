import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function BookDemo() {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      type: "cover",
      title: "L'histoire de Léo",
      subtitle: "Un bébé, mille souvenirs",
      image: "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=1000&auto=format&fit=crop",
    },
    {
      type: "full-image",
      title: "Ton arrivé",
      subtitle: "12 Janvier 2025 • 4:01 AM",
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1000&auto=format&fit=crop",
      description: "Le plus beau jour de notre vie. Léo est arrivé pesant 3.4 kg et mesurant 50 cm.",
      hasQR: true
    },
    {
      type: "split",
      title: "Nos premiers moments",
      leftImage: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=600&auto=format&fit=crop",
      rightImage: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=600&auto=format&fit=crop",
      text: "Les premiers instants sont magiques. Peau à peau, doux baisers et promesses.",
      hasQR: true
    },
    {
      type: "full-image",
      title: "Première rencontre",
      subtitle: "27 Novembre 2025",
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1000&auto=format&fit=crop",
      description: "La première fois que Léo rencontre sa grande sœur. Un moment magique gravé à jamais.",
      hasQR: true
    },
    {
      type: "three-column",
      title: "Ma première semaine",
      images: [
        "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop"
      ],
      hasQR: true
    },
    {
      type: "full-image",
      title: "Premiers pas",
      subtitle: "15 Octobre 2025",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=1000&auto=format&fit=crop",
      description: "Ça y est! Après des semaines d'attente, ses premiers pas. Nous avons tous retendu notre souffle.",
      hasQR: true
    },
    {
      type: "text-image",
      title: "Fous rires",
      description: "Les petites choses les plus simples apportent la plus grande joie. Un bain rempli de rires et d'éclaboussures.",
      image: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=600&auto=format&fit=crop",
      hasQR: true
    },
    {
      type: "end",
      title: "À suivre...",
      subtitle: "Cette histoire ne fait que commencer"
    }
  ];

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const page = pages[currentPage];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pages.length - 1;

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <button className="p-2 hover:bg-white/80 rounded-full transition-colors">
            <ChevronLeft className="text-stone-700" size={24} />
          </button>
        </Link>
      </div>

      {/* Page Counter */}
      <div className="absolute top-4 right-4 z-20">
        <span className="text-sm font-medium text-stone-600 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
          Page {currentPage + 1} / {pages.length}
        </span>
      </div>

      {/* Book Container */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl"
      >
        {/* Cover Page */}
        {page.type === "cover" && (
          <div className="relative aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden">
            <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-5xl lg:text-6xl font-serif font-bold mb-2">{page.title}</h1>
              <p className="text-xl opacity-90">{page.subtitle}</p>
            </div>
          </div>
        )}

        {/* Full Image Page */}
        {page.type === "full-image" && (
          <div className="relative aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden">
            <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute top-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl font-serif font-bold">{page.title}</h2>
              <p className="text-sm opacity-80 mt-1">{page.subtitle}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm leading-relaxed">{page.description}</p>
            </div>
            {page.hasQR && (
              <div className="absolute bottom-6 right-6 w-16 h-16 bg-white/95 rounded border-2 border-white shadow-lg flex items-center justify-center">
                <svg className="w-12 h-12" viewBox="0 0 100 100" fill="black">
                  <rect x="8" y="8" width="20" height="20" />
                  <rect x="72" y="8" width="20" height="20" />
                  <rect x="8" y="72" width="20" height="20" />
                  <rect x="42" y="42" width="16" height="16" opacity="0.5" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Split Image Page */}
        {page.type === "split" && (
          <div className="relative aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex flex-1">
              <div className="flex-1 overflow-hidden">
                <img src={page.leftImage} alt="Left" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 overflow-hidden">
                <img src={page.rightImage} alt="Right" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-stone-50 to-stone-50 p-6 border-t border-stone-100">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">{page.title}</h2>
              <p className="text-sm text-stone-600 leading-relaxed">{page.text}</p>
            </div>
            {page.hasQR && (
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded border border-stone-200 shadow flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="black">
                  <rect x="8" y="8" width="20" height="20" />
                  <rect x="72" y="8" width="20" height="20" />
                  <rect x="8" y="72" width="20" height="20" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Three Column Page */}
        {page.type === "three-column" && (
          <div className="relative aspect-[4/5] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col p-4">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">{page.title}</h2>
            <div className="flex gap-2 flex-1">
              {page.images?.map((img, idx) => (
                <div key={idx} className="flex-1 overflow-hidden rounded">
                  <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {page.hasQR && (
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded border border-stone-200 shadow flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="black">
                  <rect x="8" y="8" width="20" height="20" />
                  <rect x="72" y="8" width="20" height="20" />
                  <rect x="8" y="72" width="20" height="20" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Text + Image Page */}
        {page.type === "text-image" && (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-50 to-white rounded-lg shadow-2xl overflow-hidden flex flex-col p-8">
            <div className="mb-4">
              <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">{page.title}</h2>
              <p className="text-stone-600 leading-relaxed mb-6">{page.description}</p>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg shadow-md">
              <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
            </div>
            {page.hasQR && (
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded border border-stone-200 shadow flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="black">
                  <rect x="8" y="8" width="20" height="20" />
                  <rect x="72" y="8" width="20" height="20" />
                  <rect x="8" y="72" width="20" height="20" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* End Page */}
        {page.type === "end" && (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-900 to-stone-800 rounded-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center text-white">
            <div className="text-7xl font-serif font-light mb-8 opacity-40">♡</div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4">{page.title}</h1>
            <p className="text-lg opacity-90">{page.subtitle}</p>
            <p className="mt-12 text-sm opacity-70">Merci d'avoir partagé ces moments magiques</p>
          </div>
        )}
      </motion.div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-8 mt-12">
        <button
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-200"
          data-testid="button-previous-page"
        >
          <ChevronLeft className="text-stone-700" size={28} />
        </button>

        <div className="flex gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentPage ? "bg-primary w-8" : "bg-stone-300 w-2"
              }`}
              data-testid={`dot-page-${index}`}
            />
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-200"
          data-testid="button-next-page"
        >
          <ChevronRight className="text-stone-700" size={28} />
        </button>
      </div>

      {/* Info Text */}
      <div className="mt-8 text-center text-sm text-stone-600">
        <p>Cliquez sur les flèches ou les points pour tourner les pages</p>
      </div>

      {/* CTA Button */}
      <div className="mt-12">
        <Link href="/register">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 shadow-lg shadow-primary/20" data-testid="button-create-book">
            Créer mon livre maintenant
          </Button>
        </Link>
      </div>
    </div>
  );
}
