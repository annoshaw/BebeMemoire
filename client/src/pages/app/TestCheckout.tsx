import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, CheckCircle, BookOpen, Smartphone, BookMarked } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductType = "softcover" | "hardcover" | "ebook";

interface Book {
  id: string;
  childName: string;
  babyStatus: string;
}

export default function TestCheckout() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("softcover");
  const [pageCount, setPageCount] = useState(51);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's books
  const { data: booksData, isLoading: booksLoading } = useQuery<{ books: Book[] }>({
    queryKey: ["/api/books"],
    queryFn: async () => {
      const res = await fetch("/api/books", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
  });

  // Calculate pricing
  const calculatePrice = (type: ProductType, pages: number) => {
    const basePrice = type === "ebook" ? 3000 : type === "hardcover" ? 5499 : 4324;
    const pageRate = type === "ebook" ? 50 : 98;
    const subtotal = basePrice + (pages * pageRate);
    const tax = Math.round(subtotal * 0.15);
    const shipping = type === "ebook" ? 0 : 1200;
    const total = subtotal + tax + shipping;
    return { basePrice, subtotal, tax, shipping, total };
  };

  const pricing = calculatePrice(selectedProduct, pageCount);

  // Create order and checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBook) throw new Error("Veuillez sélectionner un livre");

      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookId: selectedBook,
          productType: selectedProduct,
          pageCount,
          shippingAddress: {
            name: "Test User",
            street: "123 Test Street",
            city: "Montreal",
            province: "QC",
            postalCode: "H2X 1Y4",
            country: "CA",
          },
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Erreur lors de la création de la commande");
      }

      const order = await orderRes.json();

      // 2. Create Stripe checkout session
      const checkoutRes = await fetch(`/api/orders/${order.id}/checkout`, {
        method: "POST",
        credentials: "include",
      });

      if (!checkoutRes.ok) {
        const err = await checkoutRes.json();
        throw new Error(err.message || "Erreur lors de la création du paiement");
      }

      const { checkoutUrl } = await checkoutRes.json();
      return checkoutUrl;
    },
    onSuccess: (checkoutUrl) => {
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const handleCheckout = () => {
    setIsProcessing(true);
    setError(null);
    checkoutMutation.mutate();
  };

  const products = [
    { id: "softcover" as ProductType, name: "Couverture Souple", icon: BookOpen, price: "43,24$" },
    { id: "hardcover" as ProductType, name: "Couverture Rigide", icon: BookMarked, price: "54,99$" },
    { id: "ebook" as ProductType, name: "E-Book PDF", icon: Smartphone, price: "30,00$" },
  ];

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/app">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Test Paiement Stripe</h1>
        </div>

        {/* Book Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">1. Sélectionner un livre</CardTitle>
          </CardHeader>
          <CardContent>
            {booksLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin" />
              </div>
            ) : booksData?.books?.length ? (
              <div className="space-y-2">
                {booksData.books.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBook(book.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedBook === book.id
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    data-testid={`book-select-${book.id}`}
                  >
                    <div className="font-medium">{book.childName}</div>
                    <div className="text-xs text-stone-500">{book.babyStatus}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-stone-500 text-sm">Aucun livre trouvé. Créez d'abord un livre.</p>
            )}
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">2. Type de produit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product.id)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    selectedProduct === product.id
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                  data-testid={`product-${product.id}`}
                >
                  <product.icon className="mx-auto mb-1" size={24} />
                  <div className="text-xs font-medium">{product.name}</div>
                  <div className="text-xs text-stone-500">{product.price}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Page Count */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">3. Nombre de pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="20"
                max="100"
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="flex-1"
                data-testid="input-pages"
              />
              <span className="font-bold w-12 text-center">{pageCount}</span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              {selectedProduct === "ebook" ? "0,50$" : "0,98$"} par page supplémentaire
            </p>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Prix de base</span>
                <span>{(pricing.basePrice / 100).toFixed(2)}$</span>
              </div>
              <div className="flex justify-between">
                <span>{pageCount} pages</span>
                <span>{((pricing.subtotal - pricing.basePrice) / 100).toFixed(2)}$</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (15%)</span>
                <span>{(pricing.tax / 100).toFixed(2)}$</span>
              </div>
              {pricing.shipping > 0 && (
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{(pricing.shipping / 100).toFixed(2)}$</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{(pricing.total / 100).toFixed(2)}$ CAD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={!selectedBook || isProcessing}
          className="w-full h-12"
          data-testid="button-checkout"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              Redirection vers Stripe...
            </>
          ) : (
            <>
              <CreditCard className="mr-2" size={20} />
              Payer {(pricing.total / 100).toFixed(2)}$ CAD
            </>
          )}
        </Button>

        <p className="text-xs text-stone-500 text-center mt-4">
          Mode test - Utilisez la carte 4242 4242 4242 4242
        </p>
      </div>
    </div>
  );
}
