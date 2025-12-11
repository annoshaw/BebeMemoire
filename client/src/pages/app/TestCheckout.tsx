import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Loader2, BookOpen, Smartphone, BookMarked, ShieldCheck, Truck, Package, ExternalLink, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type ProductType = "softcover" | "hardcover" | "ebook";

interface Book {
  id: string;
  childName: string;
  babyStatus: string;
  pageCount?: number;
}

export default function TestCheckout() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("softcover");
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

  // Get page count from selected book (default to 50 if not set)
  const selectedBookData = booksData?.books?.find(b => b.id === selectedBook);
  const pageCount = selectedBookData?.pageCount || 50;

  // Calculate pricing - 50 pages included, extra pages charged beyond that
  const INCLUDED_PAGES = 50;
  const calculatePrice = (type: ProductType, pages: number) => {
    const basePrice = type === "ebook" ? 3000 : type === "hardcover" ? 5499 : 4324;
    const pageRate = type === "ebook" ? 50 : 98;
    const extraPages = Math.max(0, pages - INCLUDED_PAGES);
    const extraPagesPrice = extraPages * pageRate;
    const subtotal = basePrice + extraPagesPrice;
    const shipping = type === "ebook" ? 0 : 1200;
    const total = subtotal + shipping;
    return { basePrice, extraPages, extraPagesPrice, subtotal, shipping, total };
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
      // Redirect to Stripe Checkout in same window
      window.location.href = checkoutUrl;
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const handleCheckout = () => {
    if (!selectedBook) {
      setError("Veuillez sélectionner un livre");
      return;
    }
    setIsProcessing(true);
    setError(null);
    checkoutMutation.mutate();
  };

  const products = [
    { 
      id: "softcover" as ProductType, 
      name: "Couverture Souple", 
      icon: BookOpen, 
      price: "43,24$",
      description: "Reliure légère et pratique",
      color: "from-amber-50 to-orange-50 border-amber-200"
    },
    { 
      id: "hardcover" as ProductType, 
      name: "Couverture Rigide", 
      icon: BookMarked, 
      price: "54,99$",
      description: "Qualité premium durable",
      color: "from-primary/10 to-emerald-50 border-primary/30"
    },
    { 
      id: "ebook" as ProductType, 
      name: "E-Book PDF", 
      icon: Smartphone, 
      price: "30,00$",
      description: "Téléchargement instantané",
      color: "from-blue-50 to-indigo-50 border-blue-200"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-stone-800 font-fraunces">Commander mon livre</h1>
            <p className="text-xs text-stone-500">Paiement sécurisé par Stripe</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-32">
        {/* Book Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-sm font-semibold text-stone-600 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">1</span>
            Sélectionner un livre
          </h2>
          
          {booksLoading ? (
            <div className="flex items-center justify-center py-8 bg-white rounded-2xl border border-stone-200">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : booksData?.books?.length ? (
            <div className="space-y-2">
              {booksData.books.map((book) => (
                <motion.button
                  key={book.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedBook(book.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedBook === book.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                  }`}
                  data-testid={`book-select-${book.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-14 rounded-lg flex items-center justify-center ${
                        selectedBook === book.id ? "bg-primary/20" : "bg-stone-100"
                      }`}>
                        <BookOpen size={20} className={selectedBook === book.id ? "text-primary" : "text-stone-400"} />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800">{book.childName}</div>
                        <div className="text-xs text-stone-500 capitalize">{book.babyStatus === "expecting" ? "En attente" : book.babyStatus}</div>
                      </div>
                    </div>
                    <div className="text-sm text-stone-400 font-medium">{book.pageCount || 50} pages</div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-amber-800 text-sm">Aucun livre trouvé. Créez d'abord un livre.</p>
            </div>
          )}
        </motion.div>

        {/* Product Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-sm font-semibold text-stone-600 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">2</span>
            Type de produit
          </h2>
          
          <div className="space-y-2">
            {products.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(product.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedProduct === product.id
                    ? `bg-gradient-to-r ${product.color} border-primary shadow-md`
                    : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                }`}
                data-testid={`product-${product.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedProduct === product.id ? "bg-white/80" : "bg-stone-100"
                    }`}>
                      <product.icon size={22} className={selectedProduct === product.id ? "text-primary" : "text-stone-400"} />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">{product.name}</div>
                      <div className="text-xs text-stone-500">{product.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-800">{product.price}</div>
                    <div className="text-[10px] text-stone-400">50 pages incluses</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Pricing Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-stone-200 p-5 mb-6 shadow-sm"
        >
          <h3 className="font-semibold text-stone-800 mb-4">Récapitulatif</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Prix de base (50 pages incluses)</span>
              <span className="font-medium">{(pricing.basePrice / 100).toFixed(2)}$</span>
            </div>
            
            {pricing.extraPages > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>{pricing.extraPages} page{pricing.extraPages > 1 ? 's' : ''} supplémentaire{pricing.extraPages > 1 ? 's' : ''}</span>
                <span className="font-medium">{(pricing.extraPagesPrice / 100).toFixed(2)}$</span>
              </div>
            )}
            
            {pricing.shipping > 0 && (
              <div className="flex justify-between text-stone-600">
                <div className="flex items-center gap-1">
                  <Truck size={14} />
                  <span>Livraison</span>
                </div>
                <span className="font-medium">{(pricing.shipping / 100).toFixed(2)}$</span>
              </div>
            )}
            
            <div className="border-t border-stone-200 pt-3 flex justify-between">
              <span className="font-bold text-stone-800">Total</span>
              <span className="font-bold text-lg text-primary">{(pricing.total / 100).toFixed(2)}$ CAD</span>
            </div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 mb-6 text-stone-400"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck size={16} />
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Package size={16} />
            <span>Livraison 5-7 jours</span>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Security Notice Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary/5 to-emerald-50 border border-primary/20 rounded-2xl p-4 mb-24"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-800 text-sm mb-1">Paiement sécurisé</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                En cliquant sur "Payer", vous serez redirigé vers notre page de paiement sécurisée propulsée par <strong>Stripe</strong>. 
                Vos informations bancaires sont protégées et ne sont jamais stockées sur nos serveurs.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleCheckout}
            disabled={!selectedBook || isProcessing}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg"
            data-testid="button-checkout"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={20} />
                <span>Redirection vers le paiement...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard size={20} />
                <span>Payer {(pricing.total / 100).toFixed(2)}$ CAD</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
