import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
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

type ProductType = "softcover" | "hardcover" | "ebook";

export default function TestCheckout() {
  const [, navigate] = useLocation();
  const [showDialog, setShowDialog] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get params from URL
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("bookId");
  const productType = (params.get("product") as ProductType) || "softcover";

  // Fetch book page count from API
  const { data: bookData, isLoading: isLoadingPages } = useQuery({
    queryKey: [`/api/books/${bookId}/pages`],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookId}/pages`, { credentials: "include" });
      if (!res.ok) return { templatePages: [] };
      return res.json();
    },
    enabled: !!bookId,
  });

  // Calculate page count from templatePages array
  const pageCount = bookData?.templatePages?.length || 50;

  // Calculate total for display
  const INCLUDED_PAGES = 50;
  const basePrice = productType === "ebook" ? 3000 : productType === "hardcover" ? 5499 : 4324;
  const pageRate = productType === "ebook" ? 50 : 98;
  const extraPages = Math.max(0, pageCount - INCLUDED_PAGES);
  const extraPagesPrice = extraPages * pageRate;
  const shipping = productType === "ebook" ? 0 : 1200;
  const total = basePrice + extraPagesPrice + shipping;

  const productNames: Record<ProductType, string> = {
    softcover: "Couverture Souple",
    hardcover: "Couverture Rigide",
    ebook: "E-Book PDF"
  };

  // Create order and checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!bookId) throw new Error("Livre non spécifié");

      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bookId,
          productType,
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
      window.location.href = checkoutUrl;
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const handleConfirm = () => {
    setIsProcessing(true);
    setError(null);
    checkoutMutation.mutate();
  };

  const handleCancel = () => {
    setShowDialog(false);
    navigate("/app");
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
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ExternalLink className="text-primary" size={28} />
            </div>
            <DialogTitle className="text-xl font-semibold">Finaliser votre commande</DialogTitle>
            <DialogDescription className="text-stone-600 mt-2">
              Vous allez être redirigé vers notre page de paiement sécurisée.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-stone-50 rounded-xl p-4 my-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Produit</span>
              <span className="font-medium">{productNames[productType]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Pages</span>
              <span className="font-medium">{pageCount} pages (50 incluses)</span>
            </div>
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
            {shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Livraison</span>
                <span className="font-medium">{(shipping / 100).toFixed(2)}$</span>
              </div>
            )}
            {productType === "ebook" && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Livraison</span>
                <span className="font-medium text-green-600">Gratuit (digital)</span>
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
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full text-stone-500"
              data-testid="button-cancel-payment"
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
