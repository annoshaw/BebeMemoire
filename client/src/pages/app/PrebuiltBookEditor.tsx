import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Sparkles } from "lucide-react";
import { BookViewer } from "@/components/book";
import type { Book } from "@shared/schema";

export default function PrebuiltBookEditor() {
  const params = useParams<{ id: string }>();
  const bookId = params.id;
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [, setLocation] = useLocation();
  const [initialPage, setInitialPage] = useState<number | undefined>(undefined);

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app">
                <Button variant="ghost" size="sm" data-testid="back-to-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === "fr" ? "Accueil" : "Home"}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-sage-900 font-fraunces">
                  {book.childName}
                </h1>
                <p className="text-sm text-sage-500">
                  {language === "fr" 
                    ? "Livre de grossesse et première année" 
                    : "Pregnancy and First Year Book"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/app?tab=inspiration")}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:from-amber-100 hover:to-orange-100 text-amber-700"
                data-testid="button-inspiration"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {language === "fr" ? "Inspiration" : "Inspiration"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                data-testid="toggle-language"
              >
                {language === "fr" ? "EN" : "FR"}
              </Button>
              <Link href={`/app/book/${bookId}/settings`}>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
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
          onGoToInspiration={() => setLocation("/app?tab=inspiration")}
          initialPage={initialPage}
        />
      </main>
    </div>
  );
}
