import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, CheckCircle, Mail, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearch } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import logoMemo from "@/assets/logo-memo.png";

export default function GiftCertificateSuccess() {
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [certificateCode, setCertificateCode] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/gift-certificates/verify-payment", { sessionId });
        const data = await response.json();
        
        if (data.success) {
          setSuccess(true);
          setCertificateCode(data.code);
          setRecipientEmail(data.recipientEmail);
        }
      } catch (error) {
        console.error("Payment verification error:", error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const copyCode = () => {
    navigator.clipboard.writeText(certificateCode);
    toast({
      title: "Code copié!",
      description: "Le code a été copié dans votre presse-papiers.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-stone-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-white font-sans">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">
              Oups, quelque chose s'est mal passé
            </h1>
            <p className="text-stone-600 mb-8">
              Nous n'avons pas pu vérifier votre paiement. Si vous avez été débité, contactez-nous.
            </p>
            <Link href="/certificat-cadeau">
              <Button>Réessayer</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-white font-sans">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 mb-4">
              Merci pour votre achat!
            </h1>
            
            <p className="text-lg text-stone-600 mb-8">
              Votre certificat-cadeau Mémo a été créé avec succès.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
                <img src={logoMemo} alt="Mémo" className="h-10 mx-auto mb-2 brightness-0 invert" />
                <p className="text-sm opacity-90">Certificat-Cadeau</p>
              </div>
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <p className="text-sm text-stone-500 mb-2">Code du certificat</p>
                  <div className="flex items-center justify-center gap-3">
                    <span 
                      className="text-2xl lg:text-3xl font-bold text-primary tracking-wider font-mono bg-stone-100 px-6 py-3 rounded-lg"
                      data-testid="text-certificate-code"
                    >
                      {certificateCode}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyCode}
                      data-testid="button-copy-code"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-xl mb-6">
                  <Mail className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">
                    Un email a été envoyé à <strong>{recipientEmail}</strong>
                  </p>
                </div>

                <div className="space-y-3 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span>Le destinataire recevra un email avec les instructions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Le code est valide pendant 1 an</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Link href="/">
                <Button variant="outline" size="lg" className="gap-2">
                  Retour à l'accueil
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
