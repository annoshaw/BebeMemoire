import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type OnboardingStep = "baby-status" | "date" | "gender" | "name" | "complete";

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>("baby-status");
  const [babyStatus, setBabyStatus] = useState<"born" | "expecting" | null>(null);
  const [babyDate, setBabyDate] = useState("");
  const [babyGender, setBabyGender] = useState<string>("");
  const [babyName, setBabyName] = useState("");

  const handleNext = () => {
    if (step === "baby-status" && babyStatus) setStep("date");
    else if (step === "date" && babyDate) setStep("gender");
    else if (step === "gender" && babyGender) setStep("name");
    else if (step === "name" && babyName) setStep("complete");
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ["baby-status", "date", "gender", "name", "complete"];
    const currentIdx = steps.indexOf(step);
    if (currentIdx > 0) setStep(steps[currentIdx - 1]);
  };

  const canContinue = () => {
    if (step === "baby-status") return babyStatus !== null;
    if (step === "date") return babyDate !== "";
    if (step === "gender") return babyGender !== "";
    if (step === "name") return babyName.trim() !== "";
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-50 to-secondary/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-stone-100">
        <button
          onClick={handleBack}
          disabled={step === "baby-status"}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="text-stone-700" />
        </button>
        <h1 className="text-xl font-serif font-bold text-stone-900">Bienvenue à Memoria</h1>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex gap-2">
          {["baby-status", "date", "gender", "name", "complete"].map((s, idx) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                ["baby-status", "date", "gender", "name", "complete"].indexOf(step) >= idx
                  ? "bg-primary"
                  : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 lg:px-6 pb-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Step 1: Baby Status */}
          {step === "baby-status" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-8"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Baby size={48} className="text-primary" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  L'aventure commence!
                </h2>
                <p className="text-stone-600">L'enfant est-il né ou à naître?</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setBabyStatus("born")}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    babyStatus === "born"
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-primary"
                  }`}
                  data-testid="button-baby-born"
                >
                  <p className="font-bold text-stone-900">Déjà né</p>
                  <p className="text-sm text-stone-600">Je veux documenter son histoire</p>
                </button>

                <button
                  onClick={() => setBabyStatus("expecting")}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    babyStatus === "expecting"
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-primary"
                  }`}
                  data-testid="button-baby-expecting"
                >
                  <p className="font-bold text-stone-900">À naître</p>
                  <p className="text-sm text-stone-600">Je prépare l'arrivée</p>
                </button>
              </div>

              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
              >
                Continuer
              </Button>
            </motion.div>
          )}

          {/* Step 2: Date */}
          {step === "date" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  {babyStatus === "born" ? "Date de naissance" : "Date prévue d'accouchement"}
                </h2>
                <p className="text-stone-600">
                  {babyStatus === "born"
                    ? "Quand est né votre bébé?"
                    : "Quand est prévue l'arrivée?"}
                </p>
              </div>

              <input
                type="date"
                value={babyDate}
                onChange={(e) => setBabyDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-primary focus:outline-none text-lg"
                data-testid="input-baby-date"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canContinue()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                >
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Gender */}
          {step === "gender" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Sexe du bébé
                </h2>
                <p className="text-stone-600">Comment souhaitez-vous le/la définir?</p>
              </div>

              <div className="space-y-3">
                {[
                  { value: "boy", label: "Garçon", emoji: "👦" },
                  { value: "girl", label: "Fille", emoji: "👧" },
                  { value: "other", label: "Autre", emoji: "✨" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBabyGender(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      babyGender === option.value
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-primary"
                    }`}
                    data-testid={`button-gender-${option.value}`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <p className="font-bold text-stone-900">{option.label}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canContinue()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                >
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Name */}
          {step === "name" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Quel est son prénom?
                </h2>
                <p className="text-stone-600">Ce nom sera sur la couverture du livre</p>
              </div>

              <input
                type="text"
                placeholder="Prénom"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-primary focus:outline-none text-lg"
                data-testid="input-baby-name"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canContinue()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                >
                  Terminer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full text-center space-y-8"
            >
              <div>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Bienvenue {babyName}!
                </h2>
                <p className="text-stone-600">
                  Votre livre est prêt à être rempli de souvenirs magiques.
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 space-y-2 text-left">
                <p className="text-sm">
                  <span className="font-bold">Date:</span> {babyDate}
                </p>
                <p className="text-sm">
                  <span className="font-bold">Statut:</span>{" "}
                  {babyStatus === "born" ? "Né" : "À naître"}
                </p>
              </div>

              <Link href="/app">
                <Button 
                  onClick={() => {
                    if (babyName && babyStatus && babyDate && babyGender) {
                      localStorage.setItem("babyName", babyName);
                      localStorage.setItem("babyStatus", babyStatus);
                      localStorage.setItem("babyDate", babyDate);
                      localStorage.setItem("babyGender", babyGender);
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg" 
                  data-testid="button-start-app"
                >
                  Commencer à créer le livre
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
