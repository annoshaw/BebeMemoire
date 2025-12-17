import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, ShieldCheck, ExternalLink, BookOpen, BookMarked, Smartphone, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

type ProductType = "softcover" | "hardcover" | "ebook";

export default function TestCheckout() {
  const [, navigate] = useLocation();
  const [showDialog, setShowDialog] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  // Get params from URL
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");
  const productParam = params.get("product") as ProductType | null;
  const itemsParam = params.get("items");
  
  // Parse multi-item orders from URL
  const [orderItems, setOrderItems] = useState<{productType: string, quantity: number, bookId: string, bookName: string}[]>([]);
  
  useEffect(() => {
    if (itemsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(itemsParam));
        setOrderItems(parsed);
        // Pre-select first product type if available
        if (parsed.length > 0 && !selectedProduct) {
          setSelectedProduct(parsed[0].productType as ProductType);
          setStep("confirm");
        }
      } catch (e) {
        console.error("Error parsing items:", e);
      }
    } else if (productParam && !selectedProduct) {
      // Single product from URL - pre-select it and go to confirm step
      setSelectedProduct(productParam);
      setStep("confirm");
    }
  }, [itemsParam, productParam]);
  
  const isMultiItemOrder = orderItems.length > 0;
  const firstBookId = isMultiItemOrder ? orderItems[0]?.bookId : bookId;

  // Fetch book page count from API
  const { data: bookData, isLoading: isLoadingPages } = useQuery({
    queryKey: [`/api/books/${firstBookId}/pages`],
    queryFn: async () => {
      const res = await fetch(`/api/books/${firstBookId}/pages`, { credentials: "include" });
      if (!res.ok) return { templatePages: [], book: null };
      return res.json();
    },
    enabled: !!firstBookId,
  });

  // Calculate page count from templatePages array
  const pageCount = bookData?.templatePages?.length || 50;
  const bookName = bookData?.book?.childName || "Mon livre";

  // Calculate total for display
  const INCLUDED_PAGES = 50;
  const getBasePrice = (type: ProductType) => type === "ebook" ? 3000 : type === "hardcover" ? 5499 : 4324;
  const getPageRate = (type: ProductType) => type === "ebook" ? 50 : 98;
  const getShipping = (type: ProductType) => type === "ebook" ? 0 : 1200;
  
  const basePrice = selectedProduct ? getBasePrice(selectedProduct) : 0;
  const pageRate = selectedProduct ? getPageRate(selectedProduct) : 0;
  const extraPages = Math.max(0, pageCount - INCLUDED_PAGES);
  const extraPagesPrice = extraPages * pageRate;
  const shipping = selectedProduct ? getShipping(selectedProduct) : 0;
  const total = basePrice + extraPagesPrice + shipping;

  const productNames: Record<ProductType, string> = {
    softcover: "Couverture Souple",
    hardcover: "Couverture Rigide",
    ebook: "E-Book PDF"
  };

  const products = [
    { 
      id: "softcover" as ProductType, 
      name: "Couverture Souple", 
      icon: BookOpen, 
      price: "43,24$",
      desc: "Reliure légère et pratique",
      color: "from-amber-50 to-orange-50 border-amber-200"
    },
    { 
      id: "hardcover" as ProductType, 
      name: "Couverture Rigide", 
      icon: BookMarked, 
      price: "54,99$",
      desc: "Qualité premium durable",
      color: "from-primary/10 to-emerald-50 border-primary/30"
    },
    { 
      id: "ebook" as ProductType, 
      name: "E-Book PDF", 
      icon: Smartphone, 
      price: "30,00$",
      desc: "Téléchargement instantané",
      color: "from-blue-50 to-indigo-50 border-blue-200"
    },
  ];

  // Calculate total for multi-item orders
  const calculateMultiItemTotal = () => {
    if (!isMultiItemOrder) return total;
    let multiTotal = 0;
    for (const item of orderItems) {
      const itemBase = getBasePrice(item.productType as ProductType);
      const itemShipping = getShipping(item.productType as ProductType);
      multiTotal += (itemBase + itemShipping) * item.quantity;
    }
    // Add per-page pricing (once, not per item)
    const pageExtra = Math.max(0, pageCount - INCLUDED_PAGES) * getPageRate(orderItems[0]?.productType as ProductType || "softcover");
    return multiTotal + pageExtra;
  };

  // Create order and checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const effectiveBookId = isMultiItemOrder ? orderItems[0]?.bookId : bookId;
      const effectiveProduct = isMultiItemOrder ? orderItems[0]?.productType : selectedProduct;
      
      if (!effectiveBookId || !effectiveProduct) throw new Error("Informations manquantes");

      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookId: effectiveBookId,
          productType: effectiveProduct,
          pageCount,
          quantity: isMultiItemOrder ? orderItems.reduce((sum, item) => sum + item.quantity, 0) : 1,
          orderItems: isMultiItemOrder ? orderItems : undefined,
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
      // Use window.open for better cross-origin redirect handling
      const newWindow = window.open(checkoutUrl, '_blank');
      if (!newWindow) {
        // Fallback if popup is blocked
        window.location.href = checkoutUrl;
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const handleSelectProduct = (type: ProductType) => {
    setSelectedProduct(type);
    setStep("confirm");
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setError(null);
    checkoutMutation.mutate();
  };

  const handleCancel = () => {
    setShowDialog(false);
    navigate("/app");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedProduct(null);
  };

  // If no bookId, redirect back
  useEffect(() => {
    if (!bookId) {
      navigate("/app");
    }
  }, [bookId, navigate]);

  if (!bookId) return null;

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <Dialog open={showDialog} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          {step === "select" ? (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {isLoadingPages ? (
                    <Loader2 className="text-primary animate-spin" size={28} />
                  ) : (
                    <ExternalLink className="text-primary" size={28} />
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold">
                  {isLoadingPages ? "Chargement..." : `Commander "${bookName}"`}
                </DialogTitle>
                <DialogDescription className="text-stone-600 mt-2">
                  {isLoadingPages ? "Récupération des informations du livre..." : `Choisissez le format de votre livre (${pageCount} pages)`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 my-4">
                {products.map((product) => (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectProduct(product.id)}
                    disabled={isLoadingPages}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all bg-gradient-to-r ${product.color} hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                    data-testid={`product-${product.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
                          <product.icon size={22} className="text-stone-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800">{product.name}</div>
                          <div className="text-xs text-stone-500">{product.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-stone-800">{product.price}</div>
                          <div className="text-[10px] text-stone-400">+ livraison</div>
                        </div>
                        <ChevronRight size={18} className="text-stone-400" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 justify-center">
                <ShieldCheck size={14} />
                <span>Vous serez redirigé vers un paiement sécurisé</span>
              </div>

              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                  className="w-full text-stone-500"
                >
                  Annuler
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="text-primary" size={28} />
                </div>
                <DialogTitle className="text-xl font-semibold">Récapitulatif</DialogTitle>
                <DialogDescription className="text-stone-600 mt-2">
                  Vérifiez votre commande avant de payer
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-stone-50 rounded-xl p-4 my-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Livre</span>
                  <span className="font-medium">{bookName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Format</span>
                  <span className="font-medium">{selectedProduct && productNames[selectedProduct]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Pages</span>
                  <span className="font-medium">{pageCount} pages (50 incluses)</span>
                </div>
                <div className="border-t border-stone-200 pt-2 mt-2"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Prix de base</span>
                  <span className="font-medium">{(basePrice / 100).toFixed(2)}$</span>
                </div>
                {extraPages > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">{extraPages} page{extraPages > 1 ? 's' : ''} suppl.</span>
                    <span className="font-medium">{(extraPagesPrice / 100).toFixed(2)}$</span>
                  </div>
                )}
                {shipping > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Livraison</span>
                    <span className="font-medium">{(shipping / 100).toFixed(2)}$</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Livraison</span>
                    <span className="font-medium text-green-600">Gratuit</span>
                  </div>
                )}
                <div className="border-t border-stone-200 pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">{(total / 100).toFixed(2)}$ CAD</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm mb-2">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-stone-500 justify-center mb-2">
                <ShieldCheck size={14} />
                <span>Paiement sécurisé par Stripe</span>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <Button 
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                  data-testid="button-confirm-payment"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Redirection...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} />
                      <span>Payer {(total / 100).toFixed(2)}$</span>
                    </div>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  disabled={isProcessing}
                  className="w-full text-stone-500"
                  data-testid="button-back"
                >
                  Retour au choix du format
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
