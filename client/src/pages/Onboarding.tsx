import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Baby, Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type OnboardingStep = "baby-status" | "date" | "gender" | "name" | "notifications" | "complete";

function mapFrequencyToSettings(frequency: string, pushEnabled: boolean) {
  const baseSettings = {
    milestoneReminders: true,
    birthdayReminders: true,
    emailNotifications: true,
    pushNotifications: pushEnabled,
    reminderDays: 1
  };
  
  switch (frequency) {
    case "daily":
      return { ...baseSettings, weeklyDigest: true, monthlyRecap: true };
    case "weekly":
      return { ...baseSettings, weeklyDigest: true, monthlyRecap: false };
    case "biweekly":
      return { ...baseSettings, weeklyDigest: true, monthlyRecap: false };
    case "monthly":
      return { ...baseSettings, weeklyDigest: false, monthlyRecap: true };
    default:
      return { ...baseSettings, weeklyDigest: true, monthlyRecap: true };
  }
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<OnboardingStep>("baby-status");
  const [babyStatus, setBabyStatus] = useState<"born" | "expecting" | "adoption" | null>(null);
  const [babyDate, setBabyDate] = useState("");
  const [babyGender, setBabyGender] = useState<string>("");
  const [babyName, setBabyName] = useState("");
  const [notificationFrequency, setNotificationFrequency] = useState<string>("");
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [notificationWeekday, setNotificationWeekday] = useState<number | null>(null); // 0=Sunday, 6=Saturday
  const [isCreating, setIsCreating] = useState(false);
  
  const weekdays = [
    { value: 0, label: "Dimanche" },
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" }
  ];

  const saveNotificationSettings = async (frequency: string, pushEnabled: boolean) => {
    try {
      const settings = mapFrequencyToSettings(frequency, pushEnabled);
      await apiRequest("PATCH", "/api/notification-settings", settings);
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  const createBookMutation = useMutation({
    mutationFn: async (bookData: {
      childName: string;
      babyStatus: string;
      babyGender: string;
      birthDate: string;
      notificationWeekday?: number | null;
    }) => {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childName: bookData.childName,
          babyStatus: bookData.babyStatus,
          babyGender: bookData.babyGender,
          birthDate: new Date(bookData.birthDate).toISOString(),
          notificationWeekday: bookData.notificationWeekday,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create book");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      localStorage.setItem("activeBookId", data.book.id);
      localStorage.setItem("babyName", babyName);
      localStorage.setItem("babyStatus", babyStatus || "");
      localStorage.setItem("babyDate", babyDate);
      localStorage.setItem("babyBirthDate", babyDate);
      localStorage.setItem("babyGender", babyGender);
      localStorage.setItem("notificationFrequency", notificationFrequency);
      localStorage.setItem("pushNotificationsEnabled", String(pushNotificationsEnabled));
      
      await saveNotificationSettings(notificationFrequency, pushNotificationsEnabled);
      
      setLocation("/app");
    },
    onError: async (error: any) => {
      console.error("Error creating book via API:", error);
      
      const response = await fetch("/api/auth/user", { credentials: "include" });
      const isAuthError = !response.ok;
      
      if (isAuthError) {
        const localBooks = JSON.parse(localStorage.getItem("localBooks") || "[]");
        const newBook = {
          id: `local_${Date.now()}`,
          childName: babyName,
          babyStatus: babyStatus,
          babyGender: babyGender,
          birthDate: babyDate,
          createdAt: new Date().toISOString(),
          synced: false,
        };
        localBooks.push(newBook);
        localStorage.setItem("localBooks", JSON.stringify(localBooks));
        localStorage.setItem("activeBookId", newBook.id);
        
        const pendingSettings = mapFrequencyToSettings(notificationFrequency, pushNotificationsEnabled);
        localStorage.setItem("pendingNotificationSettings", JSON.stringify(pendingSettings));
      } else {
        await saveNotificationSettings(notificationFrequency, pushNotificationsEnabled);
      }
      
      localStorage.setItem("babyName", babyName);
      localStorage.setItem("babyStatus", babyStatus || "");
      localStorage.setItem("babyDate", babyDate);
      localStorage.setItem("babyBirthDate", babyDate);
      localStorage.setItem("babyGender", babyGender);
      localStorage.setItem("notificationFrequency", notificationFrequency);
      localStorage.setItem("pushNotificationsEnabled", String(pushNotificationsEnabled));
      setLocation("/app");
    },
  });

  const handleNext = () => {
    if (step === "baby-status" && babyStatus) setStep("date");
    else if (step === "date" && babyDate) setStep("gender");
    else if (step === "gender" && babyGender) setStep("name");
    else if (step === "name" && babyName) setStep("notifications");
    else if (step === "notifications" && notificationFrequency) setStep("complete");
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ["baby-status", "date", "gender", "name", "notifications", "complete"];
    const currentIdx = steps.indexOf(step);
    if (currentIdx > 0) setStep(steps[currentIdx - 1]);
  };

  const canContinue = () => {
    if (step === "baby-status") return babyStatus !== null;
    if (step === "date") return babyDate !== "";
    if (step === "gender") return babyGender !== "";
    if (step === "name") return babyName.trim() !== "";
    if (step === "notifications") return notificationFrequency !== "";
    return false;
  };

  const handleCreateBook = async () => {
    if (!babyName || !babyStatus || !babyDate || !babyGender) return;
    if (babyStatus === "adoption" && notificationWeekday === null) return;
    
    setIsCreating(true);
    createBookMutation.mutate({
      childName: babyName,
      babyStatus: babyStatus,
      babyGender: babyGender,
      birthDate: babyDate,
      notificationWeekday: babyStatus === "adoption" ? notificationWeekday : null,
    });
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
        <h1 className="text-xl font-serif font-bold text-stone-900">Nouveau livre</h1>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex gap-2">
          {["baby-status", "date", "gender", "name", "notifications", "complete"].map((s, idx) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                ["baby-status", "date", "gender", "name", "notifications", "complete"].indexOf(step) >= idx
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
                <p className="text-stone-600">Quel est votre parcours?</p>
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

                <button
                  onClick={() => setBabyStatus("adoption")}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    babyStatus === "adoption"
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-primary"
                  }`}
                  data-testid="button-baby-adoption"
                >
                  <p className="font-bold text-stone-900">Adoption</p>
                  <p className="text-sm text-stone-600">Notre histoire d'amour commence</p>
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
                  {babyStatus === "born" ? "Date de naissance" : babyStatus === "adoption" ? "Date d'arrivée" : "Date prévue d'accouchement"}
                </h2>
                <p className="text-stone-600">
                  {babyStatus === "born"
                    ? "Quand est né votre bébé?"
                    : babyStatus === "adoption"
                    ? "Quand est-il/elle arrivé(e) dans votre famille?"
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

          {/* Step 5: Notifications */}
          {step === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-8"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <BellRing size={32} className="text-primary" />
                  </div>
                </div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Restez connecté
                </h2>
                <p className="text-stone-600">
                  {babyStatus === "adoption" 
                    ? "Choisissez le jour où vous souhaitez recevoir vos rappels pour capturer des moments"
                    : "À quelle fréquence souhaitez-vous recevoir des rappels pour capturer des moments?"}
                </p>
              </div>

              {babyStatus === "adoption" ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-stone-700 text-center mb-4">
                    Quel jour souhaitez-vous recevoir vos rappels hebdomadaires?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {weekdays.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => {
                          setNotificationWeekday(day.value);
                          setNotificationFrequency("weekly");
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-center ${
                          notificationWeekday === day.value
                            ? "border-primary bg-primary/5"
                            : "border-stone-200 hover:border-primary"
                        }`}
                        data-testid={`button-weekday-${day.value}`}
                      >
                        <p className="font-bold text-stone-900">{day.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { value: "daily", label: "Chaque jour", description: "Un rappel quotidien" },
                    { value: "weekly", label: "Chaque semaine", description: "Un rappel hebdomadaire" },
                    { value: "biweekly", label: "Chaque 2 semaines", description: "Deux fois par mois" },
                    { value: "monthly", label: "Chaque mois", description: "Un rappel mensuel" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNotificationFrequency(option.value)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        notificationFrequency === option.value
                          ? "border-primary bg-primary/5"
                          : "border-stone-200 hover:border-primary"
                      }`}
                      data-testid={`button-notification-${option.value}`}
                    >
                      <p className="font-bold text-stone-900">{option.label}</p>
                      <p className="text-sm text-stone-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-stone-600" />
                    <div>
                      <p className="font-medium text-stone-900">Notifications push</p>
                      <p className="text-sm text-stone-600">Recevez des alertes sur votre appareil</p>
                    </div>
                  </div>
                  <Switch
                    checked={pushNotificationsEnabled}
                    onCheckedChange={setPushNotificationsEnabled}
                    data-testid="switch-push-notifications"
                  />
                </div>
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
                  disabled={babyStatus === "adoption" ? notificationWeekday === null : !notificationFrequency}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                >
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Complete */}
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
                  {babyStatus === "born" ? "Né" : babyStatus === "adoption" ? "Adopté" : "À naître"}
                </p>
              </div>

              <Button 
                onClick={handleCreateBook}
                disabled={isCreating}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg" 
                data-testid="button-start-app"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Commencer à créer le livre"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
