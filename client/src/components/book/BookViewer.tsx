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
  Check, 
  Circle,
  BookOpen,
  List,
  Grid,
  Sparkles,
  Pencil
} from "lucide-react";
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

export function BookViewer({ bookId, language, onGoToInspiration, initialPage }: BookViewerProps) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"parts" | "page">("parts");
  const [hasInitialPageOpened, setHasInitialPageOpened] = useState(false);
  const queryClient = useQueryClient();

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
  
  // Create a virtual "Inspiration" part if there are inspiration pages
  const hasInspirationSection = inspirationPages.length > 0;
  const inspirationPartId = "inspiration-section";

  if (viewMode === "page" && selectedPageNumber !== null) {
    const templatePage = templatePages?.find(p => p.pageNumber === selectedPageNumber);
    const userPage = pages.find(p => p.pageNumber === selectedPageNumber);
    
    return (
      <PageEditor
        bookId={bookId}
        pageNumber={selectedPageNumber}
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
    if (partId === inspirationPartId) {
      return inspirationPages;
    }
    return regularTemplatePages?.filter(p => p.partId === partId) || [];
  };
  
  // Check if we're viewing the inspiration section
  const isInspirationSelected = hasInspirationSection && selectedPartIndex === (templateParts?.length || 0);

  const isPageCompleted = (pageNumber: number) => {
    return pages.find(p => p.pageNumber === pageNumber)?.isCompleted || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-sage-900 font-fraunces">
            {book.childName}
          </h2>
          <p className="text-sage-600">
            {language === "fr" 
              ? `${completedCount} / ${totalPages} pages complétées`
              : `${completedCount} / ${totalPages} pages completed`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {onGoToInspiration && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToInspiration}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100 text-amber-700"
              data-testid="button-inspiration-viewer"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {language === "fr" ? "Inspiration" : "Inspiration"}
            </Button>
          )}
          <Progress value={progressPercent} className="w-32 h-2" />
        </div>
      </div>

      <Separator />

      {templateParts && templateParts.length > 0 ? (
        <div className="flex gap-6">
          <div className="w-1/3 min-w-[250px] max-w-[350px] flex-shrink-0">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {templateParts.map((part, index) => {
                  const partPages = getPagesByPart(part.id);
                  const partCompletedCount = partPages.filter(p => isPageCompleted(p.pageNumber)).length;
                  const isSelected = selectedPartIndex === index;

                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPartIndex(index)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        isSelected 
                          ? "bg-sage-100 border-sage-300 border-2" 
                          : "bg-white border border-sage-200 hover:bg-sage-50"
                      }`}
                      data-testid={`part-button-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {language === "fr" ? "Partie" : "Part"} {part.partNumber}
                            </Badge>
                            {partCompletedCount === partPages.length && partPages.length > 0 && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <h3 className="font-medium text-sage-900 mt-1">
                            {language === "fr" ? part.titleFr : part.titleEn}
                          </h3>
                          <p className="text-sm text-sage-500 mt-1">
                            {partCompletedCount}/{partPages.length} {language === "fr" ? "pages" : "pages"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                
                {/* Inspiration Section */}
                {hasInspirationSection && (
                  <button
                    onClick={() => setSelectedPartIndex(templateParts?.length || 0)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      isInspirationSelected 
                        ? "bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300 border-2" 
                        : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:from-amber-100 hover:to-orange-100"
                    }`}
                    data-testid="part-button-inspiration"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-700">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {language === "fr" ? "Bonus" : "Bonus"}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-amber-800 mt-1">
                          {language === "fr" ? "Pages d'inspiration" : "Inspiration Pages"}
                        </h3>
                        <p className="text-sm text-amber-600 mt-1">
                          {inspirationPages.length} {language === "fr" ? "pages ajoutées" : "pages added"}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 min-h-[200px]">
            {/* Show inspiration pages section */}
            {isInspirationSelected ? (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-fraunces text-amber-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {language === "fr" ? "Pages d'inspiration" : "Inspiration Pages"}
                  </CardTitle>
                  <p className="text-sm text-amber-600">
                    {language === "fr" 
                      ? "Pages personnalisées ajoutées à votre livre" 
                      : "Custom pages added to your book"}
                  </p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inspirationPages.map((page: any) => {
                        const completed = isPageCompleted(page.pageNumber);
                        return (
                          <button
                            key={page.id}
                            onClick={() => {
                              setSelectedPageNumber(page.pageNumber);
                              setViewMode("page");
                            }}
                            className={`p-4 rounded-lg border text-left transition-all hover:shadow-md group ${
                              completed 
                                ? "bg-green-50 border-green-200 hover:bg-green-100" 
                                : "bg-white border-amber-200 hover:border-amber-300"
                            }`}
                            data-testid={`page-button-${page.pageNumber}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                completed ? "bg-green-500 text-white" : "bg-amber-100 text-amber-600"
                              }`}>
                                {completed ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sage-900 truncate">
                                    {language === "fr" ? page.titleFr : page.titleEn}
                                  </h4>
                                </div>
                                {page.subtitleFr && (
                                  <p className="text-sm text-sage-500 truncate">
                                    {language === "fr" ? page.subtitleFr : page.subtitleEn}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                                    Page {page.pageNumber}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : templateParts && templateParts[selectedPartIndex] ? (
              <Card className="border-sage-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-fraunces">
                    {language === "fr" 
                      ? templateParts[selectedPartIndex].titleFr 
                      : templateParts[selectedPartIndex].titleEn}
                  </CardTitle>
                  {templateParts[selectedPartIndex].descriptionFr && (
                    <p className="text-sm text-sage-600">
                      {language === "fr" 
                        ? templateParts[selectedPartIndex].descriptionFr 
                        : templateParts[selectedPartIndex].descriptionEn}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getPagesByPart(templateParts[selectedPartIndex].id).map((page) => {
                        const completed = isPageCompleted(page.pageNumber);
                        return (
                          <button
                            key={page.id}
                            onClick={() => {
                              setSelectedPageNumber(page.pageNumber);
                              setViewMode("page");
                            }}
                            className={`p-4 rounded-lg border text-left transition-all hover:shadow-md group ${
                              completed 
                                ? "bg-green-50 border-green-200 hover:bg-green-100" 
                                : "bg-white border-sage-200 hover:border-sage-300"
                            }`}
                            data-testid={`page-button-${page.pageNumber}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                completed ? "bg-green-500 text-white" : "bg-sage-100 text-sage-500"
                              }`}>
                                {completed ? <Check className="w-4 h-4" /> : <span>{page.pageNumber}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sage-900 truncate">
                                    {language === "fr" ? page.titleFr : page.titleEn}
                                  </h4>
                                  {completed && (
                                    <Pencil className="w-3 h-3 text-sage-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                                {page.subtitleFr && (
                                  <p className="text-sm text-sage-500 truncate">
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
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : null}
          </div>
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
