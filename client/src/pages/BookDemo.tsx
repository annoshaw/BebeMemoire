import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function BookDemo() {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: "L'histoire de Léo",
      subtitle: "Un bébé, mille souvenirs",
      type: "cover",
      image: "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop",
      date: "Janvier 2025"
    },
    {
      title: "Bienvenue Léo !",
      subtitle: "12 Janvier 2025",
      type: "birth",
      stats: {
        weight: "3.4 kg",
        height: "51 cm",
        time: "04:23"
      },
      description: "Le plus beau jour de notre vie. Léo est arrivé en parfaite santé, entouré de tout l'amour du monde."
    },
    {
      title: "Première rencontre",
      subtitle: "27 Novembre 2025",
      type: "photo",
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
      description: "Le moment magique où Léo a rencontré sa petite sœur pour la première fois. Il était si doux et curieux !",
      hasVideo: true
    },
    {
      title: "Premiers pas",
      subtitle: "15 Octobre 2025",
      type: "milestone",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
      description: "Ça y est ! Après des semaines d'hésitation, il s'est lancé vers le canapé. Nous avons tous retenu notre souffle et puis... applaudissements !",
      hasVideo: true
    },
    {
      title: "Fous rires dans le bain",
      subtitle: "02 Septembre 2025",
      type: "video",
      image: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=800&auto=format&fit=crop",
      description: "Les petites choses les plus simples apportent la plus grande joie. Un bain rempli de rires et d'éclaboussures.",
      hasVideo: true
    },
    {
      title: "Fin du livre",
      type: "end",
      description: "Merci d'avoir partagé les premiers moments magiques de la vie de Léo. Cette histoire ne fait que commencer...",
      date: "À suivre..."
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <button className="p-2 hover:bg-white rounded-full transition-colors">
            <ChevronLeft className="text-stone-700" size={24} />
          </button>
        </Link>
      </div>

      {/* Page Counter */}
      <div className="absolute top-4 right-4 z-20">
        <span className="text-sm font-medium text-stone-600 bg-white px-3 py-1 rounded-full shadow-sm">
          Page {currentPage + 1} / {pages.length}
        </span>
      </div>

      {/* Book Container */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, rotateY: 20 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        {/* Book Page - Cover */}
        {page.type === "cover" && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[4/5] flex flex-col">
            <div className="relative flex-1">
              <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <p className="text-sm font-medium opacity-80 mb-2">{page.date}</p>
                <h1 className="text-4xl lg:text-5xl font-serif font-bold">{page.title}</h1>
                <p className="text-lg opacity-90 mt-2">{page.subtitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Book Page - Birth Stats */}
        {page.type === "birth" && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[4/5] flex flex-col p-8 justify-center">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900">{page.title}</h1>
              <p className="text-stone-500 mt-2">{page.subtitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {Object.entries(page.stats || {}).map(([key, value]) => (
                <div key={key} className="bg-stone-50 rounded-xl p-6 text-center border border-stone-100">
                  <span className="block text-3xl font-bold text-primary mb-2">{value}</span>
                  <span className="text-xs uppercase tracking-wider text-stone-400">{key}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-lg text-stone-600 leading-relaxed">{page.description}</p>
            </div>
          </div>
        )}

        {/* Book Page - Photo/Video Page */}
        {(page.type === "photo" || page.type === "video" || page.type === "milestone") && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden aspect-[4/5] flex flex-col">
            <div className="flex-1 relative bg-stone-100">
              <img src={page.image} alt={page.title} className="w-full h-full object-cover" />
              {page.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-stone-900 border-b-[8px] border-b-transparent ml-1" />
                    </div>
                    <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold">
                      <QrCode size={14} />
                      <span>QR CODE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gradient-to-br from-stone-50 to-white">
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">{page.title}</h2>
              <p className="text-sm text-stone-400 mb-4">{page.subtitle}</p>
              <p className="text-stone-600 leading-relaxed text-sm">{page.description}</p>
            </div>
          </div>
        )}

        {/* Book Page - End Page */}
        {page.type === "end" && (
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-lg shadow-2xl overflow-hidden aspect-[4/5] flex flex-col items-center justify-center p-8 text-white text-center">
            <div className="max-w-sm">
              <div className="text-5xl font-serif font-bold mb-6">♡</div>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold mb-4">{page.title}</h1>
              <p className="text-lg text-stone-300 leading-relaxed mb-8">{page.description}</p>
              <p className="text-sm text-stone-500 font-serif italic">{page.date}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-8 mt-12">
        <button
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-testid="button-previous-page"
        >
          <ChevronLeft className="text-stone-700" size={28} />
        </button>

        <div className="flex gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPage ? "bg-primary w-8" : "bg-stone-300"
              }`}
              data-testid={`dot-page-${index}`}
            />
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-testid="button-next-page"
        >
          <ChevronRight className="text-stone-700" size={28} />
        </button>
      </div>

      {/* Info Text */}
      <div className="mt-8 text-center text-sm text-stone-600">
        <p>Cliquez sur les flèches ou les points pour naviguer dans le livre</p>
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
