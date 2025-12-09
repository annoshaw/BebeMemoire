import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Baby, Bell, BellRing, Loader2, AlertCircle, Sparkles, Edit3, Heart, Users, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

type OnboardingStep = "template" | "baby-status" | "date" | "gender" | "name" | "notifications" | "complete";

interface BookTemplate {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  iconName: string | null;
  isActive: boolean;
}

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
  const [step, setStep] = useState<OnboardingStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [babyStatus, setBabyStatus] = useState<"born" | "expecting" | "adoption" | null>(null);
  const [babyDate, setBabyDate] = useState("");
  const [dateUnknown, setDateUnknown] = useState(false);
  const [babyGender, setBabyGender] = useState<string>("");
  const [babyName, setBabyName] = useState("");
  const [nameUnknown, setNameUnknown] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState<string>("");
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [notificationWeekday, setNotificationWeekday] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["/api/book-templates"],
    queryFn: async () => {
      const response = await fetch("/api/book-templates", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  const templates: BookTemplate[] = templatesData?.templates || [];

  const requestPushPermission = async (enabled: boolean) => {
    if (!enabled) {
      setPushNotificationsEnabled(false);
      return;
    }

    if (!("Notification" in window)) {
      setPushPermissionStatus("unsupported");
      setPushNotificationsEnabled(false);
      toast.error("Votre navigateur ne supporte pas les notifications push");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission as "granted" | "denied" | "default");
      
      if (permission === "granted") {
        setPushNotificationsEnabled(true);
        toast.success("Notifications push activées !");
        
        new Notification("Memoria", {
          body: "Les notifications push sont maintenant activées !",
          icon: "/favicon.ico"
        });
      } else if (permission === "denied") {
        setPushNotificationsEnabled(false);
        toast.error("Permission refusée. Vous pouvez l'activer dans les paramètres de votre navigateur.");
      } else {
        setPushNotificationsEnabled(false);
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Erreur lors de la demande de permission");
      setPushNotificationsEnabled(false);
    }
  };
  
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
      templateSlug?: string | null;
      bookType: string;
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
          templateSlug: bookData.templateSlug,
          bookType: bookData.bookType,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create book");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      const effectiveName = nameUnknown ? "Mon enfant" : babyName;
      const effectiveDate = dateUnknown ? "" : babyDate;
      
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      localStorage.setItem("activeBookId", data.book.id);
      localStorage.setItem("babyName", effectiveName);
      localStorage.setItem("babyStatus", babyStatus || "");
      localStorage.setItem("babyDate", effectiveDate);
      localStorage.setItem("babyBirthDate", effectiveDate);
      localStorage.setItem("babyGender", babyGender);
      localStorage.setItem("notificationFrequency", notificationFrequency);
      localStorage.setItem("pushNotificationsEnabled", String(pushNotificationsEnabled));
      localStorage.setItem("selectedTemplate", selectedTemplate || "custom");
      
      await saveNotificationSettings(notificationFrequency, pushNotificationsEnabled);
      
      const isPrebuilt = selectedTemplate && selectedTemplate !== "custom";
      if (isPrebuilt) {
        setLocation(`/app/book/${data.book.id}/prebuilt`);
      } else {
        setLocation("/app");
      }
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
          templateSlug: selectedTemplate,
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
      
      const effectiveName = nameUnknown ? "Mon enfant" : babyName;
      const effectiveDate = dateUnknown ? "" : babyDate;
      
      localStorage.setItem("babyName", effectiveName);
      localStorage.setItem("babyStatus", babyStatus || "");
      localStorage.setItem("babyDate", effectiveDate);
      localStorage.setItem("babyBirthDate", effectiveDate);
      localStorage.setItem("babyGender", babyGender);
      localStorage.setItem("notificationFrequency", notificationFrequency);
      localStorage.setItem("pushNotificationsEnabled", String(pushNotificationsEnabled));
      localStorage.setItem("selectedTemplate", selectedTemplate || "custom");
      setLocation("/app");
    },
  });

  const allSteps: OnboardingStep[] = ["template", "baby-status", "date", "gender", "name", "notifications", "complete"];

  const handleNext = () => {
    if (step === "template" && selectedTemplate) setStep("baby-status");
    else if (step === "baby-status" && babyStatus) setStep("date");
    else if (step === "date" && (babyDate || dateUnknown)) setStep("gender");
    else if (step === "gender" && babyGender) setStep("name");
    else if (step === "name" && (babyName || nameUnknown)) setStep("notifications");
    else if (step === "notifications" && notificationFrequency) setStep("complete");
  };

  const handleBack = () => {
    const currentIdx = allSteps.indexOf(step);
    if (currentIdx > 0) setStep(allSteps[currentIdx - 1]);
  };

  const canContinue = () => {
    if (step === "template") return selectedTemplate !== null;
    if (step === "baby-status") return babyStatus !== null;
    if (step === "date") return babyDate !== "" || dateUnknown;
    if (step === "gender") return babyGender !== "";
    if (step === "name") return babyName.trim() !== "" || nameUnknown;
    if (step === "notifications") return notificationFrequency !== "";
    return false;
  };

  const handleCreateBook = async () => {
    const effectiveName = nameUnknown ? "Mon enfant" : babyName;
    const effectiveDate = dateUnknown ? new Date().toISOString().split('T')[0] : babyDate;
    
    if (!effectiveName || !babyStatus || (!effectiveDate && !dateUnknown) || !babyGender) return;
    
    setIsCreating(true);
    const isPrebuilt = selectedTemplate && selectedTemplate !== "custom";
    
    createBookMutation.mutate({
      childName: effectiveName,
      babyStatus: babyStatus,
      babyGender: babyGender,
      birthDate: effectiveDate,
      notificationWeekday: babyStatus === "adoption" ? notificationWeekday : null,
      templateSlug: isPrebuilt ? selectedTemplate : null,
      bookType: isPrebuilt ? "prebuilt" : "custom",
    });
  };

  const isPrebuiltTemplate = (slug: string) => slug !== "custom";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-50 to-secondary/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-stone-100">
        <button
          onClick={handleBack}
          disabled={step === "template"}
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
          {allSteps.map((s, idx) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                allSteps.indexOf(step) >= idx
                  ? "bg-primary"
                  : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 lg:px-6 pb-8 flex items-center justify-center overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Template Selection */}
          {step === "template" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto w-full space-y-6"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles size={32} className="text-primary" />
                  </div>
                </div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Quel type de livre?
                </h2>
                <p className="text-stone-600">
                  Choisissez entre un modèle pré-construit ou créez le vôtre
                </p>
              </div>

              {isLoadingTemplates ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.filter(t => t.slug !== 'prebuilt_adoption').map((template) => {
                    const isSelected = selectedTemplate === template.slug;
                    const isPrebuilt = isPrebuiltTemplate(template.slug);
                    
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.slug)}
                        className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-stone-200 hover:border-primary/50 hover:bg-stone-50"
                        }`}
                        data-testid={`button-template-${template.slug}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isPrebuilt 
                              ? "bg-gradient-to-br from-primary to-primary/70" 
                              : "bg-gradient-to-br from-secondary to-secondary/70"
                          }`}>
                            {isPrebuilt ? (
                              <Sparkles className="w-7 h-7 text-white" />
                            ) : (
                              <Edit3 className="w-7 h-7 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-stone-900">{template.nameFr}</p>
                              {isPrebuilt && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                  Recommandé
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-stone-600 mb-3">
                              {template.descriptionFr}
                            </p>
                            
                            {isPrebuilt && (
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md text-xs text-stone-600">
                                  <Heart size={12} /> Grossesse
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md text-xs text-stone-600">
                                  <Baby size={12} /> Naissance
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md text-xs text-stone-600">
                                  <Users size={12} /> Adoption
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 rounded-md text-xs text-stone-600">
                                  <Cake size={12} /> Jalons
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected 
                              ? "border-primary bg-primary" 
                              : "border-stone-300"
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <Button
                onClick={handleNext}
                disabled={!canContinue()}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
              >
                Continuer
              </Button>
            </motion.div>
          )}

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
                  onClick={() => { setBabyStatus("born"); setNotificationWeekday(null); }}
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
                  onClick={() => { setBabyStatus("expecting"); setNotificationWeekday(null); }}
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
                  onClick={() => { setBabyStatus("adoption"); setNotificationWeekday(null); }}
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
                  {babyStatus === "born" ? "Date de naissance" : babyStatus === "adoption" ? "Date prévue d'adoption" : "Date prévue d'accouchement"}
                </h2>
                <p className="text-stone-600">
                  {babyStatus === "born"
                    ? "Quand est né votre bébé?"
                    : babyStatus === "adoption"
                    ? "Quand est prévue l'arrivée de votre enfant?"
                    : "Quand est prévue l'arrivée?"}
                </p>
              </div>

              {babyStatus === "adoption" && (
                <button
                  onClick={() => {
                    setDateUnknown(!dateUnknown);
                    if (!dateUnknown) setBabyDate("");
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    dateUnknown
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-primary"
                  }`}
                  data-testid="button-date-unknown"
                >
                  <span className="text-xl">❓</span>
                  <div className="text-left">
                    <p className="font-bold text-stone-900">Je ne sais pas encore</p>
                    <p className="text-sm text-stone-600">La date n'est pas encore déterminée</p>
                  </div>
                </button>
              )}

              {!dateUnknown && (
                <input
                  type="date"
                  value={babyDate}
                  onChange={(e) => setBabyDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-primary focus:outline-none text-lg"
                  data-testid="input-baby-date"
                />
              )}

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

              {babyStatus === "adoption" && (
                <button
                  onClick={() => {
                    setNameUnknown(!nameUnknown);
                    if (!nameUnknown) setBabyName("");
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    nameUnknown
                      ? "border-primary bg-primary/5"
                      : "border-stone-200 hover:border-primary"
                  }`}
                  data-testid="button-name-unknown"
                >
                  <span className="text-xl">❓</span>
                  <div className="text-left">
                    <p className="font-bold text-stone-900">Je ne sais pas encore</p>
                    <p className="text-sm text-stone-600">Le prénom n'est pas encore choisi</p>
                  </div>
                </button>
              )}

              {!nameUnknown && (
                <input
                  type="text"
                  placeholder="Prénom"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-primary focus:outline-none text-lg"
                  data-testid="input-baby-name"
                />
              )}

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
                    <Bell size={20} className={pushNotificationsEnabled ? "text-primary" : "text-stone-600"} />
                    <div>
                      <p className="font-medium text-stone-900">Notifications push</p>
                      <p className="text-sm text-stone-600">
                        {pushPermissionStatus === "denied" 
                          ? "Permission refusée - activez dans les paramètres du navigateur"
                          : pushPermissionStatus === "unsupported"
                          ? "Non supporté sur cet appareil"
                          : "Recevez des alertes sur votre appareil"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={pushNotificationsEnabled}
                    onCheckedChange={requestPushPermission}
                    disabled={pushPermissionStatus === "denied" || pushPermissionStatus === "unsupported"}
                    data-testid="switch-push-notifications"
                  />
                </div>
                {pushPermissionStatus === "denied" && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Pour activer les notifications, allez dans les paramètres de votre navigateur et autorisez les notifications pour ce site.</span>
                  </div>
                )}
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
                  <span className="font-bold">Type de livre:</span>{" "}
                  {selectedTemplate && selectedTemplate !== "custom" ? "Parcours Grossesse, Bébé & Adoption" : "Personnalisé"}
                </p>
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
