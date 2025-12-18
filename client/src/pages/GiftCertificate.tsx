import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Book, Star, Check, CreditCard, Mail, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import logoMemo from "@/assets/logo-memo.png";

const PRICING = {
  softcover: { price: 43.24, name: "Couverture Souple" },
  hardcover: { price: 54.99, name: "Couverture Rigide" },
  ebook: { price: 30.00, name: "E-Book" },
  premium: { price: 23.88, name: "Premium" },
  platine: { price: 59.88, name: "Platine" },
};

interface CheckoutData {
  productType: string;
  includesSubscription: boolean;
  subscriptionType?: string;
  purchaserEmail: string;
  purchaserName: string;
  recipientEmail?: string;
  recipientName?: string;
}

export default function GiftCertificate() {
  const { toast } = useToast();
  const [category, setCategory] = useState<"book" | "bundle">("book");
  const [productType, setProductType] = useState<string>("softcover");
  const [subscriptionType, setSubscriptionType] = useState<string>("premium");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendToSelf, setSendToSelf] = useState(false);

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutData) => {
      const response = await apiRequest("POST", "/api/gift-certificates/checkout", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le certificat-cadeau. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    let total = PRICING[productType as keyof typeof PRICING]?.price || 0;
    if (category === "bundle") {
      total += PRICING[subscriptionType as keyof typeof PRICING]?.price || 0;
    }
    return total.toFixed(2);
  };

  const handleCheckout = () => {
    if (!purchaserName.trim() || !purchaserEmail.trim()) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir votre nom et email.",
        variant: "destructive",
      });
      return;
    }

    if (!sendToSelf && (!recipientEmail.trim())) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir l'email du destinataire ou cocher 'M'envoyer le certificat'.",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({
      productType,
      includesSubscription: category === "bundle",
      subscriptionType: category === "bundle" ? subscriptionType : undefined,
      purchaserEmail,
      purchaserName,
      recipientEmail: sendToSelf ? purchaserEmail : recipientEmail,
      recipientName: sendToSelf ? purchaserName : recipientName,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-white font-sans">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Gift className="w-10 h-10 text-primary" />
              <img src={logoMemo} alt="Mémo" className="h-12" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-stone-900 mb-4">
              Offrez des <span className="text-primary italic">souvenirs</span>
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Le cadeau parfait pour les nouveaux parents, les futurs parents ou les familles adoptantes.
              Un certificat-cadeau pour créer un livre de souvenirs unique.
            </p>
          </motion.div>

          <Tabs value={category} onValueChange={(v) => setCategory(v as "book" | "bundle")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
              <TabsTrigger value="book" className="text-base" data-testid="tab-book-only">
                <Book className="w-4 h-4 mr-2" />
                Livre seul
              </TabsTrigger>
              <TabsTrigger value="bundle" className="text-base" data-testid="tab-bundle">
                <Star className="w-4 h-4 mr-2" />
                Livre + Abonnement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="book" className="mt-0">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    Choisissez le type de livre
                  </CardTitle>
                  <CardDescription>
                    Le destinataire pourra commander son livre imprimé avec ce certificat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={productType} onValueChange={setProductType} className="space-y-3">
                    {[
                      { id: "softcover", name: "Couverture Souple", price: "$43.24", desc: "Finition mate, légère et élégante" },
                      { id: "hardcover", name: "Couverture Rigide", price: "$54.99", desc: "Couverture robuste pour une conservation durable" },
                      { id: "ebook", name: "E-Book", price: "$30.00", desc: "Version numérique PDF haute résolution" },
                    ].map((product) => (
                      <div
                        key={product.id}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          productType === product.id 
                            ? "border-primary bg-primary/5" 
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                        onClick={() => setProductType(product.id)}
                        data-testid={`product-${product.id}`}
                      >
                        <RadioGroupItem value={product.id} id={product.id} />
                        <div className="flex-1">
                          <Label htmlFor={product.id} className="text-base font-medium cursor-pointer">
                            {product.name}
                          </Label>
                          <p className="text-sm text-stone-500">{product.desc}</p>
                        </div>
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bundle" className="mt-0 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-primary" />
                    Choisissez le type de livre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={productType} onValueChange={setProductType} className="space-y-3">
                    {[
                      { id: "softcover", name: "Couverture Souple", price: "$43.24" },
                      { id: "hardcover", name: "Couverture Rigide", price: "$54.99" },
                      { id: "ebook", name: "E-Book", price: "$30.00" },
                    ].map((product) => (
                      <div
                        key={product.id}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          productType === product.id 
                            ? "border-primary bg-primary/5" 
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                        onClick={() => setProductType(product.id)}
                        data-testid={`bundle-product-${product.id}`}
                      >
                        <RadioGroupItem value={product.id} id={`bundle-${product.id}`} />
                        <Label htmlFor={`bundle-${product.id}`} className="flex-1 text-base font-medium cursor-pointer">
                          {product.name}
                        </Label>
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Choisissez l'abonnement
                  </CardTitle>
                  <CardDescription>
                    L'abonnement donne accès aux fonctionnalités avancées pendant 1 an.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={subscriptionType} onValueChange={setSubscriptionType} className="space-y-3">
                    <div
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        subscriptionType === "premium" 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                      onClick={() => setSubscriptionType("premium")}
                      data-testid="subscription-premium"
                    >
                      <RadioGroupItem value="premium" id="premium" />
                      <div className="flex-1">
                        <Label htmlFor="premium" className="text-base font-medium cursor-pointer">
                          Premium
                        </Label>
                        <ul className="text-sm text-stone-500 mt-1 space-y-1">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Stockage 5 Go</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> QR Codes vidéo</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Export PDF</li>
                        </ul>
                      </div>
                      <span className="text-lg font-bold text-blue-600">$23.88/an</span>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        subscriptionType === "platine" 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                      onClick={() => setSubscriptionType("platine")}
                      data-testid="subscription-platine"
                    >
                      <RadioGroupItem value="platine" id="platine" />
                      <div className="flex-1">
                        <Label htmlFor="platine" className="text-base font-medium cursor-pointer">
                          Platine
                        </Label>
                        <ul className="text-sm text-stone-500 mt-1 space-y-1">
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Stockage illimité</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> QR Codes vidéo</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Livres illimités</li>
                          <li className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Support prioritaire</li>
                        </ul>
                      </div>
                      <span className="text-lg font-bold text-purple-600">$59.88/an</span>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-6"
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Vos informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaserName">Votre nom</Label>
                    <Input
                      id="purchaserName"
                      value={purchaserName}
                      onChange={(e) => setPurchaserName(e.target.value)}
                      placeholder="Jean Dupont"
                      data-testid="input-purchaser-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchaserEmail">Votre email</Label>
                    <Input
                      id="purchaserEmail"
                      type="email"
                      value={purchaserEmail}
                      onChange={(e) => setPurchaserEmail(e.target.value)}
                      placeholder="jean@example.com"
                      data-testid="input-purchaser-email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Destinataire du certificat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendToSelf"
                    checked={sendToSelf}
                    onChange={(e) => setSendToSelf(e.target.checked)}
                    className="rounded border-stone-300"
                    data-testid="checkbox-send-to-self"
                  />
                  <Label htmlFor="sendToSelf" className="text-sm cursor-pointer">
                    M'envoyer le certificat (je l'offrirai moi-même)
                  </Label>
                </div>

                {!sendToSelf && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipientName">Nom du destinataire (optionnel)</Label>
                      <Input
                        id="recipientName"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Marie Martin"
                        data-testid="input-recipient-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="recipientEmail">Email du destinataire</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="marie@example.com"
                        data-testid="input-recipient-email"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-stone-500">Total du certificat-cadeau</p>
                    <p className="text-3xl font-bold text-stone-900">${calculateTotal()} CAD</p>
                  </div>
                  <Gift className="w-12 h-12 text-primary opacity-50" />
                </div>

                <div className="space-y-2 mb-6 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Certificat valide 1 an</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Envoyé par email instantanément</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Code unique et sécurisé</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                  data-testid="button-checkout"
                >
                  {checkoutMutation.isPending ? (
                    "Chargement..."
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Payer avec Stripe
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
