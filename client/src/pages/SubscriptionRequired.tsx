import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Star, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: "0 $",
    description: "Parfait pour commencer",
    icon: <Star className="h-6 w-6 text-gray-500" />,
    features: [
      { text: "1 livre de mémoires", included: true },
      { text: "Stockage limité (50 Mo)", included: true },
      { text: "Templates de base", included: true },
      { text: "Export PDF basse résolution", included: true },
      { text: "Codes QR pour vidéos", included: false },
      { text: "Impression professionnelle", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "9.99 $/mois",
    description: "Pour les familles actives",
    icon: <Crown className="h-6 w-6 text-amber-500" />,
    popular: true,
    features: [
      { text: "Livres illimités", included: true },
      { text: "Stockage 5 Go", included: true },
      { text: "Tous les templates", included: true },
      { text: "Export PDF haute résolution", included: true },
      { text: "Codes QR pour vidéos", included: true },
      { text: "Impression professionnelle", included: true },
    ],
  },
  {
    id: "platine",
    name: "Platine",
    price: "19.99 $/mois",
    description: "Expérience complète",
    icon: <Sparkles className="h-6 w-6 text-purple-500" />,
    features: [
      { text: "Livres illimités", included: true },
      { text: "Stockage 20 Go", included: true },
      { text: "Tous les templates + exclusifs", included: true },
      { text: "Export PDF haute résolution", included: true },
      { text: "Codes QR illimités", included: true },
      { text: "Impression professionnelle + livraison gratuite", included: true },
    ],
  },
];

export default function SubscriptionRequired() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectPlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/subscription/select-plan", { plan });
      return response.json() as Promise<{ success: boolean; message?: string; requiresPayment?: boolean; plan?: string }>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Plan activé",
          description: data.message || "Votre plan a été activé",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        navigate("/app");
      } else if (data.requiresPayment) {
        toast({
          title: "Paiement requis",
          description: "Redirection vers le paiement...",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner le plan",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === "free") {
      selectPlanMutation.mutate(planId);
    } else {
      toast({
        title: "Bientôt disponible",
        description: "Les plans payants seront disponibles prochainement. Choisissez le plan gratuit pour continuer.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-subscription-title">
            Votre période d'essai est terminée
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-subscription-description">
            Merci d'avoir essayé Memoria ! Pour continuer à créer de beaux souvenirs, 
            choisissez le plan qui vous convient.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 cursor-pointer hover:shadow-lg ${
                plan.popular ? "border-amber-400 border-2 shadow-md" : "border-gray-200"
              } ${selectedPlan === plan.id ? "ring-2 ring-amber-500" : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        feature.included ? "text-gray-700" : "text-gray-400"
                      }`}
                    >
                      <Check
                        className={`h-4 w-4 ${
                          feature.included ? "text-green-500" : "text-gray-300"
                        }`}
                      />
                      {feature.text}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  disabled={selectPlanMutation.isPending}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  {selectPlanMutation.isPending && selectedPlan === plan.id
                    ? "Activation..."
                    : plan.id === "free"
                    ? "Continuer gratuitement"
                    : "Choisir ce plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Vous pouvez changer de plan à tout moment depuis les paramètres de votre compte.
        </p>
      </div>
    </div>
  );
}
