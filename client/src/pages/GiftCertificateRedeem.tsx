import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import logoMemo from "@/assets/logo-memo.png";

interface LookupResult {
  productType: string;
  includesSubscription: boolean;
  subscriptionType: string | null;
  status: string;
  isValid: boolean;
  expiresAt: string | null;
}

interface RedeemResult {
  success: boolean;
  productType: string;
  includesSubscription: boolean;
  subscriptionType: string | null;
  redirectUrl: string;
  message: string;
}

const PRODUCT_NAMES: Record<string, string> = {
  softcover: "Couverture Souple",
  hardcover: "Couverture Rigide",
  ebook: "E-Book",
};

const SUBSCRIPTION_NAMES: Record<string, string> = {
  premium: "Premium",
  platine: "Platine",
};

export default function GiftCertificateRedeem() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (certCode: string) => {
      const response = await fetch(`/api/gift-certificates/lookup/${certCode.toUpperCase()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Certificat-cadeau non trouvé");
      }
      return response.json() as Promise<LookupResult>;
    },
    onSuccess: (data) => {
      setLookupResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      setLookupResult(null);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (certCode: string) => {
      const response = await apiRequest("POST", "/api/gift-certificates/redeem", { code: certCode });
      return response.json() as Promise<RedeemResult>;
    },
    onSuccess: (data) => {
      toast({
        title: "Certificat-cadeau activé!",
        description: data.message,
      });
      if (data.redirectUrl) {
        setLocation(data.redirectUrl);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer le certificat-cadeau",
        variant: "destructive",
      });
    },
  });

  const handleLookup = () => {
    if (code.trim().length < 8) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de certificat-cadeau valide (format: MEMO-XXXXXXXX)",
        variant: "destructive",
      });
      return;
    }
    lookupMutation.mutate(code.trim());
  };

  const handleRedeem = () => {
    if (!user) {
      setLocation(`/login?redirect=/utiliser-certificat&code=${encodeURIComponent(code)}`);
      return;
    }
    redeemMutation.mutate(code.trim());
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setCode(codeParam);
      lookupMutation.mutate(codeParam);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-white font-sans">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Gift className="w-10 h-10 text-primary" />
              <img src={logoMemo} alt="Mémo" className="h-12" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 mb-4">
              Utiliser un certificat-cadeau
            </h1>
            <p className="text-lg text-stone-600">
              Entrez votre code pour activer votre livre Mémo offert.
            </p>
          </motion.div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Votre code certificat-cadeau
              </CardTitle>
              <CardDescription>
                Le code se trouve dans l'email que vous avez reçu (format: MEMO-XXXXXXXX)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="code">Code du certificat</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="MEMO-XXXXXXXX"
                    className="font-mono text-lg"
                    data-testid="input-certificate-code"
                  />
                  <Button
                    onClick={handleLookup}
                    disabled={lookupMutation.isPending || code.length < 8}
                    variant="outline"
                    data-testid="button-lookup"
                  >
                    {lookupMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Vérifier"
                    )}
                  </Button>
                </div>
              </div>

              {lookupResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 ${
                    lookupResult.isValid
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  {lookupResult.isValid ? (
                    <>
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-3">
                        <CheckCircle className="w-5 h-5" />
                        Certificat valide!
                      </div>
                      <div className="space-y-2 text-sm text-stone-600">
                        <p>
                          <strong>Livre:</strong> {PRODUCT_NAMES[lookupResult.productType] || lookupResult.productType}
                        </p>
                        {lookupResult.includesSubscription && lookupResult.subscriptionType && (
                          <p>
                            <strong>Abonnement:</strong> {SUBSCRIPTION_NAMES[lookupResult.subscriptionType] || lookupResult.subscriptionType} (1 an)
                          </p>
                        )}
                        {lookupResult.expiresAt && (
                          <p className="text-stone-400">
                            Valide jusqu'au {new Date(lookupResult.expiresAt).toLocaleDateString("fr-CA")}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      {lookupResult.status === "redeemed" 
                        ? "Ce certificat a déjà été utilisé"
                        : lookupResult.status === "expired"
                        ? "Ce certificat a expiré"
                        : "Ce certificat n'est pas valide"}
                    </div>
                  )}
                </motion.div>
              )}

              {lookupResult?.isValid && (
                <Button
                  onClick={handleRedeem}
                  disabled={redeemMutation.isPending}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                  data-testid="button-redeem"
                >
                  {redeemMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {user ? "Activer et créer mon livre" : "Se connecter pour activer"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}

              {!user && lookupResult?.isValid && (
                <p className="text-sm text-center text-stone-500">
                  Vous devez avoir un compte Mémo pour utiliser ce certificat.{" "}
                  <a href="/register" className="text-primary hover:underline">
                    Créer un compte
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
