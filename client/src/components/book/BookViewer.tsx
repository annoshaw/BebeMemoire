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
  Grid
} from "lucide-react";
import { PageEditor } from "./PageEditor";
import type { TemplatePart, TemplatePage, UserBookPage, Book, BookTemplate } from "@shared/schema";

interface BookViewerProps {
  bookId: string;
  language: "fr" | "en";
}

interface BookPagesResponse {
  pages: UserBookPage[];
  template: BookTemplate | null;
  templateParts: TemplatePart[] | null;
  templatePages: TemplatePage[] | null;
  book: Book;
}

export function BookViewer({ bookId, language }: BookViewerProps) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"parts" | "page">("parts");
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
    return templatePages?.filter(p => p.partId === partId) || [];
  };

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
        <Progress value={progressPercent} className="w-32 h-2" />
      </div>

      <Separator />

      {templateParts && templateParts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
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
              </div>
            </ScrollArea>
          </div>

          <div className="md:col-span-2">
            {templateParts[selectedPartIndex] && (
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
                            className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                              completed 
                                ? "bg-green-50 border-green-200" 
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
                                <h4 className="font-medium text-sage-900 truncate">
                                  {language === "fr" ? page.titleFr : page.titleEn}
                                </h4>
                                {page.subtitleFr && (
                                  <p className="text-sm text-sage-500 truncate">
                                    {language === "fr" ? page.subtitleFr : page.subtitleEn}
                                  </p>
                                )}
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {page.pageType.replace(/_/g, " ")}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
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
