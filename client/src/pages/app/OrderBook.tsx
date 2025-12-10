import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Printer, Check, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { Book } from "@shared/schema";

const coverOptions = [
  { id: "soft", label: "Couverture souple", labelEn: "Soft cover", price: 29.99, icon: "📖" },
  { id: "hard", label: "Couverture rigide", labelEn: "Hard cover", price: 49.99, icon: "📕" },
];

const finishOptions = [
  { id: "matte", label: "Mat", labelEn: "Matte", price: 0, icon: "🌫️" },
  { id: "glossy", label: "Brillant", labelEn: "Glossy", price: 5, icon: "✨" },
];

const paperOptions = [
  { id: "standard", label: "Papier standard", labelEn: "Standard paper", price: 0, icon: "📄" },
  { id: "premium", label: "Papier premium", labelEn: "Premium paper", price: 15, icon: "📃" },
];

export default function OrderBook() {
  const params = useParams<{ id: string }>();
  const bookId = params.id;
  const [language] = useState<"fr" | "en">("fr");
  const [selectedCover, setSelectedCover] = useState("soft");
  const [selectedFinish, setSelectedFinish] = useState("matte");
  const [selectedPaper, setSelectedPaper] = useState("standard");
  const [quantity, setQuantity] = useState(1);

  const { data: bookData, isLoading } = useQuery<{ book: Book }>({
    queryKey: ["/api/books", bookId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch book");
      return res.json();
    },
    enabled: !!bookId,
  });

  const calculateTotal = () => {
    const coverPrice = coverOptions.find(o => o.id === selectedCover)?.price || 0;
    const finishPrice = finishOptions.find(o => o.id === selectedFinish)?.price || 0;
    const paperPrice = paperOptions.find(o => o.id === selectedPaper)?.price || 0;
    return (coverPrice + finishPrice + paperPrice) * quantity;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-sage-500">
          {language === "fr" ? "Chargement..." : "Loading..."}
        </div>
      </div>
    );
  }

  const book = bookData?.book;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-sage-50">
      <header className="sticky top-0 z-50 bg-white border-b border-sage-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/app/book/${bookId}`}>
                <Button variant="ghost" size="sm" data-testid="back-to-book">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === "fr" ? "Retour au livre" : "Back to book"}
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-sage-900 font-fraunces">
                  {language === "fr" ? "Commander votre livre" : "Order your book"}
                </h1>
                <p className="text-sm text-sage-500">{book?.childName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {language === "fr" ? "Type de couverture" : "Cover type"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {coverOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCover(option.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      selectedCover === option.id
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-primary/50"
                    }`}
                    data-testid={`option-cover-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{language === "fr" ? option.label : option.labelEn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{option.price.toFixed(2)} $</span>
                      {selectedCover === option.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  {language === "fr" ? "Finition" : "Finish"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {finishOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFinish(option.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      selectedFinish === option.id
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-primary/50"
                    }`}
                    data-testid={`option-finish-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{language === "fr" ? option.label : option.labelEn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{option.price > 0 ? `+${option.price.toFixed(2)} $` : "Inclus"}</span>
                      {selectedFinish === option.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "fr" ? "Qualité du papier" : "Paper quality"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paperOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPaper(option.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      selectedPaper === option.id
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-primary/50"
                    }`}
                    data-testid={`option-paper-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{language === "fr" ? option.label : option.labelEn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{option.price > 0 ? `+${option.price.toFixed(2)} $` : "Inclus"}</span>
                      {selectedPaper === option.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  {language === "fr" ? "Votre commande" : "Your order"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-sage-50 rounded-lg">
                  <h3 className="font-bold text-sage-900 mb-2">{book?.childName}</h3>
                  <p className="text-sm text-sage-600">
                    {language === "fr" ? "Livre de souvenirs personnalisé" : "Personalized memory book"}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">{language === "fr" ? "Couverture" : "Cover"}</span>
                    <span className="font-medium">{coverOptions.find(o => o.id === selectedCover)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">{language === "fr" ? "Finition" : "Finish"}</span>
                    <span className="font-medium">{finishOptions.find(o => o.id === selectedFinish)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">{language === "fr" ? "Papier" : "Paper"}</span>
                    <span className="font-medium">{paperOptions.find(o => o.id === selectedPaper)?.label}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                  <span className="text-stone-600">{language === "fr" ? "Quantité" : "Quantity"}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      data-testid="button-decrease-quantity"
                    >
                      -
                    </Button>
                    <span className="font-bold w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      data-testid="button-increase-quantity"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">{language === "fr" ? "Total" : "Total"}</span>
                    <span className="text-2xl font-bold text-primary">{calculateTotal().toFixed(2)} $</span>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-primary to-sage-600 hover:from-primary/90 hover:to-sage-600/90 text-white h-12"
                    data-testid="button-checkout"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {language === "fr" ? "Passer à la caisse" : "Proceed to checkout"}
                  </Button>

                  <p className="text-xs text-center text-stone-500 mt-4">
                    {language === "fr" 
                      ? "Livraison estimée: 7-10 jours ouvrables" 
                      : "Estimated delivery: 7-10 business days"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
