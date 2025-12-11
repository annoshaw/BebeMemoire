import { useLocation } from "wouter";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function OrderCancel() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-200 flex items-center justify-center p-4">
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
            className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <XCircle className="w-10 h-10 text-amber-600" />
          </motion.div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            Paiement annulé
          </h1>
          <p className="text-stone-600">
            Votre paiement n'a pas été complété. Aucun montant n'a été débité.
          </p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 text-sm">
            <HelpCircle className="text-stone-500 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-stone-600">
              Si vous avez rencontré un problème lors du paiement, n'hésitez pas à réessayer ou à nous contacter pour obtenir de l'aide.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate("/app")}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
            data-testid="button-back-home"
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour à mes livres
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
