import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Baby, Calendar, Maximize, MapPin, Stethoscope } from "lucide-react";
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
      title: "Ton arrivé",
      subtitle: "le jour de ta naissance",
      type: "birth",
      mainImage: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
      stats: [
        { icon: Baby, label: "poids", value: "3.4 Lbs" },
        { icon: Maximize, label: "taille", value: "50 cm" },
        { icon: Calendar, label: "heure", value: "4:01 am" },
      ],
      sections: [
        {
          title: "bienvenue parmi nous",
          text: "Le déroulement de ton arrivée s'est passé en quelques lignes comment s'est passé l'accouchement, le travail, la venue de la sage-femme, l'étape un accouchement provoque, au fur-à-ce un appel d'accouchement, les péripéties de l'événement, le déroulement."
        },
        {
          title: "nos premiers moments ensemble",
          text: "Ta première baignoire la peau à peau avec la maman : comment s'est passé le premier bain (acouchement / biberon)? Qu'a donné cette nuit avec ta première nuit?"
        }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=400&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop"
      ]
    },
    {
      title: "Première rencontre",
      subtitle: "27 Novembre 2025",
      type: "memory",
      mainImage: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
      description: "Le moment magique où Léo a rencontré sa petite sœur pour la première fois. Il était si doux et curieux !",
      metadata: [
        { label: "Lieu", value: "Maison de naissance" },
        { label: "Moment", value: "Jour 5" }
      ],
      hasVideo: true
    },
    {
      title: "Premiers pas",
      subtitle: "15 Octobre 2025",
      type: "memory",
      mainImage: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
      description: "Ça y est ! Après des semaines d'hésitation, il s'est lancé vers le canapé. Nous avons tous retenu notre souffle et puis... applaudissements !",
      metadata: [
        { label: "Lieu", value: "Salon" },
        { label: "Moment", value: "10 mois" }
      ],
      hasVideo: true
    },
    {
      title: "Fous rires dans le bain",
      subtitle: "02 Septembre 2025",
      type: "memory",
      mainImage: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=800&auto=format&fit=crop",
      description: "Les petites choses les plus simples apportent la plus grande joie. Un bain rempli de rires et d'éclaboussures.",
      metadata: [
        { label: "Lieu", value: "Salle de bain" },
        { label: "Moment", value: "4 mois" }
      ],
      hasVideo: true
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
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 flex flex-col items-center justify-center p-4">
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
        <span className="text-sm font-medium text-stone-600 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm">
          Page {currentPage + 1} / {pages.length}
        </span>
      </div>

      {/* Book Container */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl"
      >
        {/* Cover Page */}
        {page.type === "cover" && (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg shadow-2xl overflow-hidden">
            <div className="absolute inset-0">
              <img src={page.image} alt={page.title} className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-100/80 via-stone-100/60 to-stone-100/80" />
            </div>

            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 text-5xl font-serif font-light text-stone-400 opacity-50">✿</div>
              <h1 className="text-5xl lg:text-6xl font-serif font-bold text-stone-800 mb-2">{page.title}</h1>
              <p className="text-lg text-stone-600 mb-8">{page.subtitle}</p>
              <p className="text-sm text-stone-500 font-medium">{page.date}</p>
              
              <div className="absolute bottom-8 text-4xl font-serif font-light text-stone-200 opacity-30">✿ ✿ ✿</div>
            </div>
          </div>
        )}

        {/* Birth Page */}
        {page.type === "birth" && (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 rounded-lg shadow-2xl overflow-hidden p-8">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <div className="absolute top-2 left-2 text-6xl font-serif font-light text-stone-300">✿</div>
              <div className="absolute top-1/4 right-4 text-5xl font-serif font-light text-stone-300">✿</div>
              <div className="absolute bottom-1/4 left-1/4 text-5xl font-serif font-light text-stone-300">✿</div>
            </div>

            <div className="relative h-full flex flex-col">
              {/* Title */}
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Baby size={20} className="text-secondary-foreground" />
                  </div>
                  <h1 className="text-4xl font-serif font-bold text-stone-900">{page.title}</h1>
                </div>
                <p className="text-sm text-stone-500">{page.subtitle}</p>
              </div>

              {/* Main Image */}
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img src={page.mainImage} alt={page.title} className="w-full h-full object-cover" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                {page.stats?.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white/60 backdrop-blur rounded-lg p-2 border border-stone-100">
                      <Icon size={16} className="mx-auto text-stone-600 mb-1" />
                      <p className="text-xs font-bold text-stone-800">{stat.value}</p>
                      <p className="text-[10px] text-stone-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Content Sections */}
              <div className="flex-1 overflow-y-auto space-y-4 text-sm">
                {page.sections?.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">{section.title}</h3>
                    <p className="text-stone-600 text-xs leading-relaxed">{section.text}</p>
                  </div>
                ))}
              </div>

              {/* Gallery Thumbnails */}
              {page.gallery && (
                <div className="flex gap-2 mt-4 justify-center">
                  {page.gallery.map((img, idx) => (
                    <div key={idx} className="w-12 h-12 rounded border border-stone-200 overflow-hidden">
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* QR Code */}
              <div className="absolute bottom-2 right-2 w-12 h-12 bg-white border border-stone-200 rounded flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 100 100" fill="black">
                  <rect x="10" y="10" width="15" height="15" />
                  <rect x="75" y="10" width="15" height="15" />
                  <rect x="10" y="75" width="15" height="15" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Memory Pages */}
        {page.type === "memory" && (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-50 via-amber-50 to-stone-50 rounded-lg shadow-2xl overflow-hidden p-8">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="text-9xl font-serif font-light text-stone-300 absolute top-0 right-0">✿</div>
              <div className="text-7xl font-serif font-light text-stone-300 absolute bottom-0 left-0">✿</div>
            </div>

            <div className="relative h-full flex flex-col">
              {/* Title */}
              <div className="mb-4">
                <h1 className="text-3xl font-serif font-bold text-stone-900">{page.title}</h1>
                <p className="text-xs text-stone-500 mt-1">{page.subtitle}</p>
              </div>

              {/* Main Image with Circle Mask */}
              <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-8 border-white shadow-lg">
                <img src={page.mainImage} alt={page.title} className="w-full h-full object-cover" />
              </div>

              {/* Description */}
              <p className="text-sm text-stone-700 leading-relaxed mb-4">{page.description}</p>

              {/* Metadata */}
              {page.metadata && (
                <div className="space-y-2 text-xs mb-4">
                  {page.metadata.map((meta, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-stone-200">
                      <span className="text-stone-600 font-medium">{meta.label}</span>
                      <span className="text-stone-800">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Video Indicator */}
              {page.hasVideo && (
                <div className="flex items-center justify-center gap-2 p-3 bg-white/60 backdrop-blur rounded-lg mt-auto">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-primary border-b-[3px] border-b-transparent ml-0.5" />
                  </div>
                  <span className="text-xs font-bold text-stone-700">Vidéo QR</span>
                </div>
              )}

              {/* QR Code */}
              <div className="absolute bottom-4 right-4 w-14 h-14 bg-white border-2 border-stone-200 rounded flex items-center justify-center shadow-md">
                <svg className="w-12 h-12" viewBox="0 0 100 100" fill="black">
                  <rect x="10" y="10" width="18" height="18" />
                  <rect x="72" y="10" width="18" height="18" />
                  <rect x="10" y="72" width="18" height="18" />
                  <rect x="40" y="40" width="20" height="20" opacity="0.7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-8 mt-12">
        <button
          onClick={goToPreviousPage}
          disabled={isFirstPage}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-100"
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
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-100"
          data-testid="button-next-page"
        >
          <ChevronRight className="text-stone-700" size={28} />
        </button>
      </div>

      {/* Info Text */}
      <div className="mt-8 text-center text-sm text-stone-600">
        <p>Cliquez sur les flèches pour tourner les pages</p>
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
