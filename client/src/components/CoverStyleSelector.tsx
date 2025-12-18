import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { coverStyles, type CoverStyle } from "@shared/coverStyles";
import { Button } from "@/components/ui/button";

interface CoverStyleSelectorProps {
  language: "en" | "fr";
  selectedCover: string | null;
  onSelectCover: (coverId: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function CoverStyleSelector({
  language,
  selectedCover,
  onSelectCover,
  onConfirm,
  onBack,
}: CoverStyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<CoverStyle["category"] | "all">("all");

  const categories = [
    { id: "all" as const, label: language === "fr" ? "Tous" : "All" },
    { id: "floral" as const, label: language === "fr" ? "Floral" : "Floral" },
    { id: "nature" as const, label: "Nature" },
    { id: "classic" as const, label: language === "fr" ? "Classique" : "Classic" },
    { id: "modern" as const, label: language === "fr" ? "Moderne" : "Modern" },
  ];

  const filteredStyles = activeCategory === "all" 
    ? coverStyles 
    : coverStyles.filter(s => s.category === activeCategory);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-stone-800">
          {language === "fr" ? "Choisissez votre style de couverture" : "Choose your cover style"}
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          {language === "fr" ? "19 designs exclusifs pour personnaliser votre livre" : "19 exclusive designs to personalize your book"}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-primary text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
            data-testid={`filter-category-${cat.id}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {filteredStyles.map((style) => (
            <motion.button
              key={style.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCover(style.id)}
              className={`relative rounded-xl overflow-hidden aspect-[3/4] border-2 transition-all ${
                selectedCover === style.id
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-stone-200 hover:border-primary/50"
              }`}
              data-testid={`cover-style-${style.id}`}
            >
              <img
                src={style.imageUrl}
                alt={style.name[language]}
                className="w-full h-full object-cover"
              />
              
              {selectedCover === style.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium text-center">
                  {style.name[language]}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          data-testid="button-back-to-format"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {language === "fr" ? "Format" : "Format"}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!selectedCover}
          className="flex-1 bg-primary hover:bg-primary/90"
          data-testid="button-confirm-cover"
        >
          {language === "fr" ? "Continuer" : "Continue"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
