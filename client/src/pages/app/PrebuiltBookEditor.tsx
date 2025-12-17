import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Sparkles, ChevronRight, Plus, X, Loader2, ShoppingCart, BookOpen, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { BookViewer } from "@/components/book";
import type { Book } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PrintPreview } from "@/components/book";

const inspirationCategories = [
  { title: "Présentation de la famille", icon: "👨‍👩‍👧‍👦", color: "from-teal-100", hasSubPages: true },
  { title: "Annonce de grossesse", icon: "🤰", color: "from-pink-100", hasSubPages: true },
  { title: "Échographie", icon: "🔊", color: "from-purple-100", hasSubPages: true },
  { title: "Premières fois", icon: "👣", color: "from-amber-100", hasSubPages: true },
  { title: "Allaitement", icon: "🤱", color: "from-rose-100", hasSubPages: true },
  { title: "Adoption", icon: "💕", color: "from-blue-100", hasSubPages: false },
  { title: "FIV", icon: "🌱", color: "from-orange-100", hasSubPages: false },
  { title: "Événements lors de la grossesse", icon: "🎉", color: "from-yellow-100", hasSubPages: true },
  { title: "Chambre de bébé", icon: "🛏️", color: "from-green-100", hasSubPages: false },
  { title: "Lettre à bébé", icon: "💌", color: "from-red-100", hasSubPages: false },
];

const inspirationSubPages: Record<string, {id: number, title: string, icon: string, color: string, desc?: string}[]> = {
  "Présentation de la famille": [
    { id: 1, title: "Tes grands-parents", icon: "👴👵", color: "from-amber-100", desc: "Leur lien, date de naissance, hobbies, ce qu'ils aiment" },
    { id: 2, title: "Tes oncles et tantes", icon: "👨‍👩‍👦", color: "from-blue-100", desc: "Nom, lien avec les parents, date de naissance, hobbies, travail" },
    { id: 3, title: "Tes cousin(e)s", icon: "👧👦", color: "from-green-100", desc: "Noms, liens (enfants de qui?), date de naissance" },
    { id: 4, title: "Tes amis poilus", icon: "🐾", color: "from-orange-100", desc: "Description, date de naissance, depuis quand dans la famille" },
    { id: 5, title: "Les amis de la famille", icon: "🤝", color: "from-purple-100", desc: "Lien avec les parents, pourquoi importants, depuis quand" },
  ],
  "Annonce de grossesse": [
    { id: 1, title: "Réaction de tes grands-parents", icon: "👴👵", color: "from-amber-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
    { id: 2, title: "Réaction de ton parrain", icon: "👨", color: "from-blue-100", desc: "Comment a-t-il réagi, qui lui a annoncé et de quelle façon" },
    { id: 3, title: "Réaction de ta marraine", icon: "👩", color: "from-pink-100", desc: "Comment a-t-elle réagi, qui lui a annoncé et de quelle façon" },
    { id: 4, title: "Réaction de tes oncles/tantes", icon: "👨‍👩‍👦", color: "from-teal-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
    { id: 5, title: "Réaction de tes cousin(e)s", icon: "👧👦", color: "from-green-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
    { id: 6, title: "Réaction de tes amis poilus", icon: "🐾", color: "from-orange-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
  ],
  "Échographie": [
    { id: 1, title: "Ta première échographie", icon: "🔊", color: "from-purple-100" },
    { id: 2, title: "Ta deuxième échographie", icon: "🔊", color: "from-indigo-100" },
    { id: 3, title: "Ta troisième échographie", icon: "🔊", color: "from-blue-100" },
    { id: 4, title: "Les échographies de suivi", icon: "📋", color: "from-teal-100" },
    { id: 5, title: "La première fois que j'ai entendu ton coeur", icon: "💓", color: "from-pink-100" },
  ],
  "Événements lors de la grossesse": [
    { id: 1, title: "L'annonce du parrain", icon: "👨", color: "from-blue-100" },
    { id: 2, title: "L'annonce de la marraine", icon: "👩", color: "from-pink-100" },
    { id: 3, title: "Le dévoilement de sexe", icon: "🎀", color: "from-purple-100" },
    { id: 4, title: "Le baby shower", icon: "🎁", color: "from-yellow-100" },
    { id: 5, title: "Le baby moon", icon: "🌙", color: "from-indigo-100" },
  ],
  "Premières fois": [
    { id: 1, title: "Tes premiers pas", icon: "👣", color: "from-orange-100", desc: "Ces pas hésitants vers l'aventure" },
    { id: 2, title: "Ton premier voyage", icon: "✈️", color: "from-sky-100", desc: "Notre première aventure ensemble loin de la maison" },
    { id: 3, title: "Première fois à la plage", icon: "🏖️", color: "from-amber-100", desc: "Le sable, la mer, de nouvelles sensations" },
    { id: 4, title: "Premier sourire", icon: "😊", color: "from-yellow-100", desc: "Ce sourire qui illumine nos journées" },
    { id: 5, title: "Premier mot", icon: "💬", color: "from-indigo-100", desc: "Ta petite voix qui prononce ses premiers sons" },
    { id: 6, title: "Première dent", icon: "🦷", color: "from-cyan-100", desc: "Cette petite perle blanche tant attendue" },
    { id: 7, title: "Premier bain", icon: "🛁", color: "from-blue-100", desc: "Barbotage et découverte de l'eau" },
    { id: 8, title: "Premier repas solide", icon: "🥄", color: "from-green-100", desc: "La diversification commence, nouvelles saveurs!" },
    { id: 9, title: "Premier Noël", icon: "🎄", color: "from-red-100", desc: "La magie de Noël à travers tes yeux émerveillés" },
  ],
  "Allaitement": [
    { id: 1, title: "1er mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 2, title: "2e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 3, title: "3e mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 4, title: "4e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 5, title: "5e mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 6, title: "6e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 7, title: "7e mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 8, title: "8e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 9, title: "9e mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 10, title: "10e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 11, title: "11e mois d'allaitement", icon: "🤱", color: "from-rose-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
    { id: 12, title: "12e mois d'allaitement", icon: "🤱", color: "from-pink-100", desc: "Comment ça s'est passé? Quelles émotions avez-vous vécues?" },
  ],
};

export default function PrebuiltBookEditor() {
  const params = useParams<{ id: string }>();
  const bookId = params.id;
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [, setLocation] = useLocation();
  const [initialPage, setInitialPage] = useState<number | undefined>(undefined);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [showDigitalPreview, setShowDigitalPreview] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const queryClient = useQueryClient();

  const addInspirationPageToBook = async (pageTitle: string, pageDesc?: string) => {
    if (!bookId || isAddingPage) return;
    
    setIsAddingPage(true);
    try {
      const response = await fetch(`/api/books/${bookId}/add-inspiration-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: pageTitle,
          titleEn: pageTitle,
          subtitle: pageDesc || "",
          subtitleEn: pageDesc || "",
          pageType: "text_photo",
          prompts: pageDesc ? [pageDesc] : [],
          promptsEn: pageDesc ? [pageDesc] : [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add page");
      }

      const data = await response.json();
      
      // Refresh the book pages
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "user-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId] });
      
      toast.success(
        language === "fr" 
          ? `Page "${pageTitle}" ajoutée au livre!` 
          : `Page "${pageTitle}" added to book!`
      );
      
      setShowInspirationModal(false);
      setSelectedCategory(null);
      
      // Navigate to the new page
      if (data.pageNumber) {
        setInitialPage(data.pageNumber);
      }
    } catch (error) {
      console.error("Error adding inspiration page:", error);
      toast.error(
        language === "fr" 
          ? "Erreur lors de l'ajout de la page" 
          : "Error adding page"
      );
    } finally {
      setIsAddingPage(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get("page");
      if (pageParam) {
        const pageNum = parseInt(pageParam, 10);
        if (!isNaN(pageNum) && pageNum > 0) {
          setInitialPage(pageNum);
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    }
  }, []);

  const { data: bookData, isLoading, error } = useQuery<{ book: Book }>({
    queryKey: ["/api/books", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load book");
      return res.json();
    },
    enabled: !!bookId,
  });

  // Query for user pages (completed pages for digital preview)
  const { data: pagesData } = useQuery<{ pages: any[], templatePages: any[] }>({
    queryKey: ["/api/books", bookId, "pages"],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}/pages`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load pages");
      return res.json();
    },
    enabled: !!bookId,
  });

  // Get completed pages for preview
  const completedPages = pagesData?.pages?.filter(p => p.isCompleted) || [];
  const templatePages = pagesData?.templatePages || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-sage-500">
          {language === "fr" ? "Chargement..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {language === "fr" 
              ? "Erreur lors du chargement du livre" 
              : "Error loading book"}
          </p>
          <Link href="/app">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour" : "Back"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const book = bookData.book;

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-50 bg-white border-b border-sage-200 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/app">
                <Button variant="ghost" size="sm" data-testid="back-to-home" className="px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{language === "fr" ? "Accueil" : "Home"}</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-sage-900 font-fraunces truncate">
                  {book.childName}
                </h1>
                <p className="text-xs sm:text-sm text-sage-500 hidden sm:block">
                  {language === "fr" 
                    ? "Livre de grossesse et première année" 
                    : "Pregnancy and First Year Book"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewPageIndex(0);
                  setShowDigitalPreview(true);
                }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 px-2 sm:px-3"
                data-testid="button-digital-preview"
              >
                <BookOpen className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{language === "fr" ? "Aperçu" : "Preview"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInspirationModal(true)}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100 text-amber-700 px-2 sm:px-3"
                data-testid="button-inspiration"
              >
                <Sparkles className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{language === "fr" ? "Inspiration" : "Inspiration"}</span>
              </Button>
              <Button
                size="sm"
                className="bg-[#6a8c79] text-white px-2 sm:px-3"
                data-testid="button-order"
                onClick={() => setLocation(`/app/test-checkout?bookId=${bookId}`)}
              >
                <ShoppingCart className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{language === "fr" ? "Commander" : "Order"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                data-testid="toggle-language"
                className="px-2 sm:px-3"
              >
                {language === "fr" ? "EN" : "FR"}
              </Button>
              <Link href={`/app/book/${bookId}/settings`}>
                <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-9 sm:h-9">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BookViewer 
          bookId={bookId!} 
          language={language} 
          onGoToInspiration={() => setShowInspirationModal(true)}
          initialPage={initialPage}
        />
      </main>

      {/* Inspiration Modal */}
      <AnimatePresence>
        {showInspirationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => {
              setShowInspirationModal(false);
              setSelectedCategory(null);
            }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-lg">
                      {language === "fr" ? "Pages d'inspiration" : "Inspiration Pages"}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {language === "fr" ? "Ajoutez ces pages spéciales à votre livre" : "Add these special pages to your book"}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowInspirationModal(false);
                      setSelectedCategory(null);
                    }}
                    className="p-2 hover:bg-stone-100 rounded-full"
                  >
                    <X size={20} className="text-stone-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {selectedCategory ? (
                  <>
                    {/* Back button */}
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 mb-4"
                    >
                      <ArrowLeft size={16} />
                      {language === "fr" ? "Retour" : "Back"}
                    </button>
                    
                    <h4 className="font-bold text-stone-800 mb-3">{selectedCategory}</h4>
                    
                    {/* Sub-pages list */}
                    {inspirationSubPages[selectedCategory]?.map((subPage) => (
                      <motion.div
                        key={subPage.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-b ${subPage.color} to-stone-50 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg">{subPage.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-stone-800 text-sm block">{subPage.title}</span>
                            {subPage.desc && (
                              <span className="text-xs text-stone-500 line-clamp-2">{subPage.desc}</span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs flex-shrink-0 ml-2"
                          disabled={isAddingPage}
                          onClick={() => addInspirationPageToBook(subPage.title, subPage.desc)}
                        >
                          {isAddingPage ? (
                            <Loader2 size={12} className="mr-1 animate-spin" />
                          ) : (
                            <Plus size={12} className="mr-1" />
                          )}
                          {language === "fr" ? "Ajouter" : "Add"}
                        </Button>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Categories list */}
                    {inspirationCategories.map((category, idx) => (
                      <motion.div
                        key={category.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between hover:border-amber-300 transition-colors ${category.hasSubPages ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (category.hasSubPages) {
                            setSelectedCategory(category.title);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-b ${category.color} to-stone-50 rounded-lg flex items-center justify-center`}>
                            <span className="text-lg">{category.icon}</span>
                          </div>
                          <div>
                            <span className="font-medium text-stone-800 text-sm">{category.title}</span>
                          </div>
                        </div>
                        {category.hasSubPages ? (
                          <ChevronRight size={18} className="text-stone-400" />
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            disabled={isAddingPage}
                            onClick={(e) => {
                              e.stopPropagation();
                              addInspirationPageToBook(category.title);
                            }}
                          >
                            {isAddingPage ? (
                              <Loader2 size={12} className="mr-1 animate-spin" />
                            ) : (
                              <Plus size={12} className="mr-1" />
                            )}
                            {language === "fr" ? "Ajouter" : "Add"}
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digital Book Preview Modal */}
      <Dialog open={showDigitalPreview} onOpenChange={setShowDigitalPreview}>
        <DialogContent className="w-[98vw] max-w-4xl h-[95dvh] sm:h-auto sm:max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 border-b bg-stone-50 flex-shrink-0">
            <DialogTitle className="text-lg font-fraunces flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              {language === "fr" ? "Aperçu numérique du livre" : "Digital Book Preview"}
            </DialogTitle>
            <p className="text-sm text-stone-500">
              {language === "fr" 
                ? `${completedPages.length} page${completedPages.length > 1 ? 's' : ''} complétée${completedPages.length > 1 ? 's' : ''}`
                : `${completedPages.length} completed page${completedPages.length > 1 ? 's' : ''}`}
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden bg-stone-100 p-4">
            {completedPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BookOpen className="w-16 h-16 text-stone-300 mb-4" />
                <h3 className="text-lg font-medium text-stone-600">
                  {language === "fr" ? "Aucune page complétée" : "No completed pages"}
                </h3>
                <p className="text-sm text-stone-500 mt-2 max-w-sm">
                  {language === "fr" 
                    ? "Complétez des pages pour voir l'aperçu de votre livre ici."
                    : "Complete pages to see your book preview here."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Book page display */}
                <div className="flex-1 flex items-center justify-center">
                  {(() => {
                    const currentPage = completedPages[previewPageIndex];
                    const templatePage = templatePages.find((t: any) => t.pageNumber === currentPage?.pageNumber);
                    if (!currentPage || !templatePage) return null;
                    
                    const customData = typeof currentPage.customData === 'string' 
                      ? JSON.parse(currentPage.customData || '{}') 
                      : (currentPage.customData || {});
                    const textStyles = customData.textStyles || {};
                    const titleStyle = customData.titleStyle || { fontFamily: "'Fraunces', serif", fontSize: 24 };
                    
                    return (
                      <div className="bg-white shadow-2xl border border-stone-300 w-full max-w-[320px] sm:max-w-[400px]" style={{ aspectRatio: '8.5 / 11' }}>
                        <PrintPreview
                          photos={currentPage.photos || []}
                          textContent={currentPage.textContent || []}
                          videoUrl={currentPage.videoUrl}
                          customData={customData}
                          pageNumber={currentPage.pageNumber}
                          title={language === "fr" ? templatePage.titleFr : templatePage.titleEn}
                          subtitle={language === "fr" ? templatePage.subtitleFr : templatePage.subtitleEn}
                          language={language}
                          titleStyle={titleStyle}
                          textStyles={textStyles}
                          collageStyle={customData.collageStyle}
                          selectedLayoutId={customData.photoLayouts?.[0]}
                          monthNumber={customData.monthNumber}
                        />
                      </div>
                    );
                  })()}
                </div>
                
                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPageIndex(Math.max(0, previewPageIndex - 1))}
                    disabled={previewPageIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {language === "fr" ? "Précédent" : "Previous"}
                  </Button>
                  
                  <span className="text-sm text-stone-600">
                    {previewPageIndex + 1} / {completedPages.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPageIndex(Math.min(completedPages.length - 1, previewPageIndex + 1))}
                    disabled={previewPageIndex === completedPages.length - 1}
                  >
                    {language === "fr" ? "Suivant" : "Next"}
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
