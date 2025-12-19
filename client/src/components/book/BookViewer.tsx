import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Check, 
  Circle,
  BookOpen,
  List,
  Grid,
  Sparkles,
  Pencil,
  Trash2,
  X,
  HelpCircle,
  ArrowDown,
  ArrowRight,
  MousePointer2,
  Plus,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageEditor } from "./PageEditor";
import type { TemplatePart, TemplatePage, UserBookPage, Book, BookTemplate } from "@shared/schema";

interface BookViewerProps {
  bookId: string;
  language: "fr" | "en";
  onGoToInspiration?: () => void;
  initialPage?: number;
}

interface BookPagesResponse {
  pages: UserBookPage[];
  template: BookTemplate | null;
  templateParts: TemplatePart[] | null;
  templatePages: TemplatePage[] | null;
  book: Book;
}

const TUTORIAL_STORAGE_KEY = "memoria_book_tutorial_seen";

interface TutorialStep {
  id: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  position: "left" | "right" | "center";
  arrowDirection?: "down" | "right" | "left";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    titleFr: "Bienvenue dans votre livre !",
    titleEn: "Welcome to your book!",
    descriptionFr: "Ce guide va vous montrer comment remplir votre livre de souvenirs. C'est très simple !",
    descriptionEn: "This guide will show you how to fill your memory book. It's very easy!",
    position: "center",
  },
  {
    id: "parts",
    titleFr: "1. Choisissez une section",
    titleEn: "1. Choose a section",
    descriptionFr: "Cliquez sur une des parties du livre pour voir les pages qu'elle contient. Chaque section correspond à une période (grossesse, naissance, etc.)",
    descriptionEn: "Click on a book section to see its pages. Each section corresponds to a period (pregnancy, birth, etc.)",
    position: "left",
    arrowDirection: "down",
  },
  {
    id: "pages",
    titleFr: "2. Sélectionnez une page",
    titleEn: "2. Select a page",
    descriptionFr: "Cliquez sur une page pour la remplir avec vos photos et textes. Les pages complétées sont marquées en vert.",
    descriptionEn: "Click on a page to fill it with your photos and text. Completed pages are marked in green.",
    position: "right",
    arrowDirection: "down",
  },
  {
    id: "progress",
    titleFr: "3. Suivez votre progression",
    titleEn: "3. Track your progress",
    descriptionFr: "La barre de progression en haut vous montre combien de pages vous avez complétées. Vous pouvez toujours revenir modifier une page !",
    descriptionEn: "The progress bar at the top shows how many pages you've completed. You can always come back to edit a page!",
    position: "center",
  },
  {
    id: "preview",
    titleFr: "4. Prévisualisez votre livre",
    titleEn: "4. Preview your book",
    descriptionFr: "Cliquez sur le bouton 'Aperçu' en haut pour voir à quoi ressemblera votre livre une fois imprimé. Vous verrez toutes vos pages complétées !",
    descriptionEn: "Click the 'Preview' button at the top to see what your book will look like when printed. You'll see all your completed pages!",
    position: "center",
  },
];

export function BookViewer({ bookId, language, onGoToInspiration, initialPage }: BookViewerProps) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"parts" | "page">("parts");
  const [hasInitialPageOpened, setHasInitialPageOpened] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const resetTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const { data, isLoading, error } = useQuery<BookPagesResponse>({
    queryKey: ["/api/books", bookId, "pages"],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}/pages`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load book pages");
      return res.json();
    },
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/books/${bookId}/initialize-pages`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initialize pages");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      const res = await fetch(`/api/books/${bookId}/pages/${pageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete page");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
    },
  });

  const updateChildNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ childName: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update name");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsEditingName(false);
    },
  });

  const addBlankPageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/books/${bookId}/add-inspiration-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          templateId: "blank-page",
          titleFr: "",
          titleEn: "",
          subtitleFr: "",
          subtitleEn: "",
          pageType: "text_photo",
          prompts: [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add blank page");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId] });
    },
  });

  useEffect(() => {
    if (data && data.templatePages && data.pages.length === 0 && data.book.templateSlug) {
      initializeMutation.mutate();
    }
  }, [data]);

  useEffect(() => {
    if (initialPage && data?.templatePages && !hasInitialPageOpened) {
      const page = data.templatePages.find(p => p.pageNumber === initialPage);
      if (page) {
        setSelectedPageNumber(initialPage);
        setViewMode("page");
        setHasInitialPageOpened(true);
      }
    }
  }, [initialPage, data, hasInitialPageOpened]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sage-500">
          {language === "fr" ? "Chargement du livre..." : "Loading book..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        {language === "fr" 
          ? "Erreur lors du chargement du livre" 
          : "Error loading book"}
      </div>
    );
  }

  if (!data) return null;

  const { pages, templateParts, templatePages, book } = data;

  // Separate inspiration pages from regular template pages
  const inspirationPages = templatePages?.filter((p: any) => p.isInspirationPage === true) || [];
  const regularTemplatePages = templatePages?.filter((p: any) => !p.isInspirationPage) || [];
  
  // Check if there's an inspiration/bonus section in templateParts (from API)
  const hasInspirationSection = templateParts?.some((p: any) => p.isInspirationSection === true) || false;
  const inspirationPartId = "inspiration-part"; // Match the API's virtual part ID

  if (viewMode === "page" && selectedPageNumber !== null) {
    const templatePage = templatePages?.find(p => p.pageNumber === selectedPageNumber);
    const userPage = pages.find(p => p.pageNumber === selectedPageNumber);
    
    return (
      <PageEditor
        bookId={bookId}
        pageNumber={selectedPageNumber}
        displayPageNumber={(templatePage as any)?.displayPageNumber}
        templatePage={templatePage || null}
        userPage={userPage || null}
        language={language}
        onBack={() => {
          setViewMode("parts");
          setSelectedPageNumber(null);
        }}
        onNavigate={(direction: "prev" | "next") => {
          const currentIndex = templatePages?.findIndex(p => p.pageNumber === selectedPageNumber) || 0;
          const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
          if (templatePages && newIndex >= 0 && newIndex < templatePages.length) {
            setSelectedPageNumber(templatePages[newIndex].pageNumber);
          }
        }}
        hasNext={templatePages ? templatePages.findIndex(p => p.pageNumber === selectedPageNumber) < templatePages.length - 1 : false}
        hasPrev={templatePages ? templatePages.findIndex(p => p.pageNumber === selectedPageNumber) > 0 : false}
      />
    );
  }

  const completedCount = pages.filter(p => p.isCompleted).length;
  const totalPages = templatePages?.length || pages.length || 0;
  const progressPercent = totalPages > 0 ? (completedCount / totalPages) * 100 : 0;

  const getPagesByPart = (partId: string) => {
    // For inspiration part, return pages from templatePages that have this partId
    return templatePages?.filter(p => p.partId === partId) || [];
  };
  
  // Check if we're viewing the inspiration section (last part with isInspirationSection flag)
  const isInspirationSelected = templateParts && selectedPartIndex < templateParts.length && 
    (templateParts[selectedPartIndex] as any)?.isInspirationSection === true;

  const isPageCompleted = (pageNumber: number) => {
    return pages.find(p => p.pageNumber === pageNumber)?.isCompleted || false;
  };

  const currentStep = tutorialSteps[tutorialStep];

  return (
    <div className="space-y-6 relative">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Semi-transparent backdrop */}
          <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={closeTutorial} />
          
          {/* Tutorial bubble */}
          <div 
            className={`absolute pointer-events-auto z-10 ${
              currentStep.position === "center" 
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
                : currentStep.position === "left"
                  ? "top-[40%] left-4 sm:left-8 lg:left-[10%]"
                  : "top-[40%] right-4 sm:right-8 lg:right-[10%]"
            }`}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 max-w-[320px] sm:max-w-sm relative animate-in fade-in zoom-in-95 duration-300">
              {/* Close button */}
              <button 
                onClick={closeTutorial}
                className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="tutorial-close"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {/* Step indicator */}
              <div className="flex gap-1.5 mb-4">
                {tutorialSteps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === tutorialStep 
                        ? "w-6 bg-amber-500" 
                        : idx < tutorialStep 
                          ? "w-3 bg-amber-300" 
                          : "w-3 bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-sage-900 mb-2 pr-6">
                {language === "fr" ? currentStep.titleFr : currentStep.titleEn}
              </h3>
              <p className="text-sage-600 text-sm leading-relaxed mb-5">
                {language === "fr" ? currentStep.descriptionFr : currentStep.descriptionEn}
              </p>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={closeTutorial}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  data-testid="tutorial-skip"
                >
                  {language === "fr" ? "Passer" : "Skip"}
                </button>
                <div className="flex gap-2">
                  {tutorialStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevTutorialStep}
                      data-testid="tutorial-prev"
                    >
                      {language === "fr" ? "Précédent" : "Previous"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={nextTutorialStep}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    data-testid="tutorial-next"
                  >
                    {tutorialStep === tutorialSteps.length - 1 
                      ? (language === "fr" ? "Commencer !" : "Start!")
                      : (language === "fr" ? "Suivant" : "Next")
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-lg sm:text-xl font-bold text-sage-900 font-fraunces border border-sage-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sage-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editedName.trim()) {
                      updateChildNameMutation.mutate(editedName.trim());
                    } else if (e.key === "Escape") {
                      setIsEditingName(false);
                    }
                  }}
                  data-testid="input-child-name"
                />
                <Button
                  size="sm"
                  onClick={() => editedName.trim() && updateChildNameMutation.mutate(editedName.trim())}
                  disabled={!editedName.trim() || updateChildNameMutation.isPending}
                  className="bg-sage-600 hover:bg-sage-700"
                  data-testid="button-save-child-name"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                  data-testid="button-cancel-edit-name"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-sage-900 font-fraunces">
                  {book.childName}
                </h2>
                <button
                  onClick={() => {
                    setEditedName(book.childName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 hover:bg-sage-100 rounded-full transition-colors"
                  title={language === "fr" ? "Modifier le nom" : "Edit name"}
                  data-testid="button-edit-child-name"
                >
                  <Pencil className="w-4 h-4 text-sage-500 hover:text-sage-700" />
                </button>
              </div>
            )}
            <p className="text-sm sm:text-base text-sage-600">
              {language === "fr" 
                ? `${completedCount} / ${totalPages} pages complétées`
                : `${completedCount} / ${totalPages} pages completed`}
            </p>
          </div>
          {/* Help button to re-show tutorial */}
          <button
            onClick={resetTutorial}
            className="p-2 hover:bg-amber-50 rounded-full transition-colors group"
            title={language === "fr" ? "Voir le guide" : "View guide"}
            data-testid="button-show-tutorial"
          >
            <HelpCircle className="w-5 h-5 text-amber-500 group-hover:text-amber-600" />
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {onGoToInspiration && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToInspiration}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100 text-amber-700"
              data-testid="button-inspiration-viewer"
            >
              <Sparkles className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">{language === "fr" ? "Inspiration" : "Inspiration"}</span>
            </Button>
          )}
          <Progress value={progressPercent} className="w-24 sm:w-32 h-2" />
        </div>
      </div>

      <Separator />

      {templateParts && templateParts.length > 0 ? (
        <div className="space-y-3">
          {templateParts.map((part, index) => {
            const partPages = getPagesByPart(part.id);
            const partCompletedCount = partPages.filter(p => isPageCompleted(p.pageNumber)).length;
            const isSelected = selectedPartIndex === index;
            const isInspirationPart = (part as any).isInspirationSection === true;

            return (
              <div key={part.id} className="space-y-2">
                {/* Part header - clickable */}
                <button
                  onClick={() => setSelectedPartIndex(isSelected ? -1 : index)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    isInspirationPart
                      ? isSelected
                        ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 border-2"
                        : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100"
                      : isSelected 
                        ? "bg-sage-100 border-sage-300 border-2" 
                        : "bg-white border border-sage-200 hover:bg-sage-50"
                  }`}
                  data-testid={isInspirationPart ? "part-button-inspiration" : `part-button-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isInspirationPart ? (
                          <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {language === "fr" ? "Bonus" : "Bonus"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {language === "fr" ? "Partie" : "Part"} {part.partNumber}
                          </Badge>
                        )}
                        {partCompletedCount === partPages.length && partPages.length > 0 && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <h3 className={`font-medium mt-1 ${isInspirationPart ? "text-amber-800" : "text-sage-900"}`}>
                        {language === "fr" ? part.titleFr : part.titleEn}
                      </h3>
                      <p className={`text-sm mt-1 ${isInspirationPart ? "text-amber-600" : "text-sage-500"}`}>
                        {partCompletedCount}/{partPages.length} {language === "fr" ? "pages" : "pages"}
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isSelected ? "rotate-180" : ""} ${isInspirationPart ? "text-amber-600" : "text-sage-500"}`} />
                  </div>
                </button>

                {/* Pages grid - shown when part is selected */}
                {isSelected && (
                  <div className={`rounded-lg border p-4 ${isInspirationPart ? "border-amber-200 bg-amber-50/50" : "border-sage-200 bg-sage-50/50"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {isInspirationPart ? (
                        <>
                        {inspirationPages.map((page: any) => {
                          const completed = isPageCompleted(page.pageNumber);
                          return (
                            <div
                              key={page.id}
                              className={`p-4 rounded-lg border text-left transition-all hover:shadow-md group relative ${
                                completed 
                                  ? "bg-green-50 border-green-200 hover:bg-green-100" 
                                  : "bg-white border-amber-200 hover:border-amber-300"
                              }`}
                              data-testid={`page-card-${page.pageNumber}`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedPageNumber(page.pageNumber);
                                  setViewMode("page");
                                }}
                                className="w-full text-left"
                                data-testid={`page-button-${page.pageNumber}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    completed ? "bg-green-500 text-white" : "bg-amber-100 text-amber-600"
                                  }`}>
                                    {completed ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sage-900 truncate">
                                      {language === "fr" ? page.titleFr : page.titleEn}
                                    </h4>
                                    {page.subtitleFr && (
                                      <p className="text-sm text-sage-500 truncate">
                                        {language === "fr" ? page.subtitleFr : page.subtitleEn}
                                      </p>
                                    )}
                                    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 mt-2">
                                      Page {(page as any).displayPageNumber || page.pageNumber}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                    data-testid={`delete-page-${page.pageNumber}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {language === "fr" ? "Supprimer cette page ?" : "Delete this page?"}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {language === "fr" 
                                        ? "Cette action est irréversible. La page et tout son contenu seront supprimés définitivement." 
                                        : "This action cannot be undone. The page and all its content will be permanently deleted."}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{language === "fr" ? "Annuler" : "Cancel"}</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePageMutation.mutate(page.id.replace("inspiration-", ""))}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {language === "fr" ? "Supprimer" : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          );
                        })}
                        </>
                      ) : (
                        partPages.map((page) => {
                          const completed = isPageCompleted(page.pageNumber);
                          const userPage = pages.find(p => p.pageNumber === page.pageNumber);
                          return (
                            <div
                              key={page.id}
                              className={`p-4 rounded-lg border text-left transition-all hover:shadow-md group relative ${
                                completed 
                                  ? "bg-green-50 border-green-200 hover:bg-green-100" 
                                  : "bg-white border-sage-200 hover:border-sage-300"
                              }`}
                              data-testid={`page-card-${page.pageNumber}`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedPageNumber(page.pageNumber);
                                  setViewMode("page");
                                }}
                                className="w-full text-left"
                                data-testid={`page-button-${page.pageNumber}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    completed ? "bg-green-500 text-white" : "bg-sage-100 text-sage-500"
                                  }`}>
                                    {completed ? <Check className="w-4 h-4" /> : <span>{(page as any).displayPageNumber || page.pageNumber}</span>}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start gap-2">
                                      <h4 className="font-medium text-sage-900 leading-tight">
                                        {language === "fr" ? page.titleFr : page.titleEn}
                                      </h4>
                                      {completed && (
                                        <Pencil className="w-3 h-3 text-sage-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                      )}
                                    </div>
                                    {page.subtitleFr && (
                                      <p className="text-sm text-sage-500 leading-tight mt-1">
                                        {language === "fr" ? page.subtitleFr : page.subtitleEn}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        {page.pageType.replace(/_/g, " ")}
                                      </Badge>
                                      {completed && (
                                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                                          {language === "fr" ? "Modifier" : "Edit"}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                              {userPage && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                      data-testid={`delete-page-${page.pageNumber}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {language === "fr" ? "Réinitialiser cette page ?" : "Reset this page?"}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {language === "fr" 
                                          ? "Cette action supprimera tout le contenu que vous avez ajouté à cette page (textes, photos, vidéos). La page reviendra à son état initial." 
                                          : "This will delete all content you've added to this page (text, photos, videos). The page will return to its initial state."}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{language === "fr" ? "Annuler" : "Cancel"}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deletePageMutation.mutate(userPage.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {language === "fr" ? "Réinitialiser" : "Reset"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Add blank page button - visible for all books */}
          <button
            onClick={() => addBlankPageMutation.mutate()}
            disabled={addBlankPageMutation.isPending}
            className="w-full p-4 rounded-lg border-2 border-dashed border-sage-300 bg-sage-50 hover:bg-sage-100 hover:border-sage-400 transition-all flex items-center justify-center gap-3"
            data-testid="add-blank-page-button"
          >
            {addBlankPageMutation.isPending ? (
              <Loader2 className="w-5 h-5 text-sage-500 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-sage-500" />
            )}
            <span className="font-medium text-sage-700">
              {language === "fr" ? "Ajouter une page personnalisée" : "Add a custom page"}
            </span>
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-sage-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-sage-700">
            {language === "fr" 
              ? "Aucune page disponible" 
              : "No pages available"}
          </h3>
          <p className="text-sage-500 mt-2">
            {language === "fr" 
              ? "Ce livre n'a pas encore de pages." 
              : "This book doesn't have any pages yet."}
          </p>
        </div>
      )}
    </div>
  );
}
