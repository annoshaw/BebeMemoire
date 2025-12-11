import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CheckCircle, Package, Mail, FileText, Home, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OrderSuccess() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const { data: order, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [`/api/orders/by-session/${sessionId}`],
    queryFn: async () => {
      if (!sessionId) throw new Error("Session manquante");
      const res = await fetch(`/api/orders/by-session/${sessionId}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Commande non trouvée");
      }
      return res.json();
    },
    enabled: !!sessionId,
    retry: 2,
    retryDelay: 1000,
  });

  const productNames: Record<string, string> = {
    softcover: "Couverture Souple",
    hardcover: "Couverture Rigide",
    ebook: "E-Book PDF"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-stone-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-stone-600">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-stone-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">
              Merci pour votre commande !
            </h1>
            <p className="text-stone-600">
              Votre paiement a été traité avec succès.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-amber-800 text-sm font-medium">
                  Détails de commande en cours de traitement
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  Vos détails de commande seront disponibles dans quelques instants. Un reçu vous sera envoyé par email.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={isFetching}
              className="w-full h-12 rounded-xl"
              data-testid="button-retry"
            >
              {isFetching ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <RefreshCw size={18} className="mr-2" />
              )}
              Réessayer
            </Button>
            <Button
              onClick={() => navigate("/app")}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
              data-testid="button-back-home"
            >
              <Home size={18} className="mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-stone-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            Merci pour votre commande !
          </h1>
          <p className="text-stone-600">
            Votre paiement a été traité avec succès.
          </p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
            <FileText className="text-primary" size={20} />
            <div>
              <div className="text-xs text-stone-500">Numéro de commande</div>
              <div className="font-mono font-semibold text-stone-800">{order.orderNumber}</div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Format</span>
            <span className="font-medium">{productNames[order.productType] || order.productType}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Pages</span>
            <span className="font-medium">{order.pageCount} pages</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Prix de base</span>
            <span className="font-medium">{(order.basePrice / 100).toFixed(2)}$</span>
          </div>
          
          {order.extraPagesPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Pages supplémentaires</span>
              <span className="font-medium">{(order.extraPagesPrice / 100).toFixed(2)}$</span>
            </div>
          )}
          
          {order.shippingPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Livraison</span>
              <span className="font-medium">{(order.shippingPrice / 100).toFixed(2)}$</span>
            </div>
          )}
          
          <div className="border-t border-stone-200 pt-2 flex justify-between">
            <span className="font-semibold">Total payé</span>
            <span className="text-lg font-bold text-primary">
              {(order.totalAmount / 100).toFixed(2)}$ CAD
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 text-sm">
            <Mail className="text-primary mt-0.5 flex-shrink-0" size={18} />
            <p className="text-stone-600">
              Un reçu de confirmation a été envoyé à votre adresse email.
            </p>
          </div>
          
          {order.productType !== "ebook" && (
            <div className="flex items-start gap-3 text-sm">
              <Package className="text-primary mt-0.5 flex-shrink-0" size={18} />
              <p className="text-stone-600">
                Votre livre sera imprimé et expédié dans les 5-7 jours ouvrables.
              </p>
            </div>
          )}
          
          {order.productType === "ebook" && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="text-primary mt-0.5 flex-shrink-0" size={18} />
              <p className="text-stone-600">
                Votre e-book PDF sera disponible en téléchargement dans quelques minutes.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => navigate("/app")}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
          data-testid="button-back-home"
        >
          <Home size={18} className="mr-2" />
          Retour à l'accueil
        </Button>
      </motion.div>
    </div>
  );
}
