import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, Save, Check, Calendar, Baby, Cake, Camera, Star, AlertCircle, Mail, Video, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

interface VideoStorageStatus {
  plan: string;
  videoUsedBytes: number;
  videoUsedGb: number;
  videoLimitBytes: number;
  videoLimitGb: number;
  remainingBytes: number;
  remainingGb: number;
  percentageUsed: number;
  canUploadVideos: boolean;
}

interface NotificationSettings {
  id: number;
  userId: number;
  milestoneReminders: boolean;
  weeklyDigest: boolean;
  monthlyRecap: boolean;
  birthdayReminders: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderDays: number;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const queryClient = useQueryClient();

  const { data: videoStorage } = useQuery<VideoStorageStatus>({
    queryKey: ["/api/auth/video-storage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/auth/video-storage");
      return res.json();
    },
  });
  
  const [settings, setSettings] = useState({
    milestoneReminders: true,
    weeklyDigest: true,
    monthlyRecap: true,
    birthdayReminders: true,
    emailNotifications: true,
    pushNotifications: false,
    reminderDays: 1
  });

  // Check current notification permission status on mount and when page gets focus
  useEffect(() => {
    const checkPermission = () => {
      if (!("Notification" in window)) {
        setPushPermissionStatus("unsupported");
      } else {
        const currentPermission = Notification.permission as "default" | "granted" | "denied";
        setPushPermissionStatus(currentPermission);
        // If permission was granted but our setting says off, or vice versa
        if (currentPermission === "granted" && !settings.pushNotifications) {
          // User previously enabled but setting shows off - keep it consistent
        }
      }
    };
    
    checkPermission();
    
    // Re-check when page gets focus (user might have changed browser settings)
    window.addEventListener("focus", checkPermission);
    return () => window.removeEventListener("focus", checkPermission);
  }, []);

  const requestPushPermission = async (enabled: boolean) => {
    if (!enabled) {
      setSettings(prev => ({ ...prev, pushNotifications: false }));
      return;
    }

    if (!("Notification" in window)) {
      setPushPermissionStatus("unsupported");
      setSettings(prev => ({ ...prev, pushNotifications: false }));
      toast.error("Votre navigateur ne supporte pas les notifications push");
      return;
    }

    // Re-check current permission (user might have changed settings)
    const currentPermission = Notification.permission;
    if (currentPermission === "granted") {
      // Already granted, just enable
      setPushPermissionStatus("granted");
      setSettings(prev => ({ ...prev, pushNotifications: true }));
      toast.success("Notifications push activées !");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission as "granted" | "denied" | "default");
      
      if (permission === "granted") {
        setSettings(prev => ({ ...prev, pushNotifications: true }));
        toast.success("Notifications push activées !");
        
        new Notification("Mémo", {
          body: "Les notifications push sont maintenant activées !",
          icon: "/favicon.ico"
        });
      } else if (permission === "denied") {
        setSettings(prev => ({ ...prev, pushNotifications: false }));
        toast.error("Permission refusée. Vous pouvez l'activer dans les paramètres de votre navigateur.");
      } else {
        setSettings(prev => ({ ...prev, pushNotifications: false }));
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Erreur lors de la demande de permission");
      setSettings(prev => ({ ...prev, pushNotifications: false }));
    }
  };

  const retryPushPermission = () => {
    // Re-check current permission
    if ("Notification" in window) {
      const currentPermission = Notification.permission;
      setPushPermissionStatus(currentPermission as "granted" | "denied" | "default");
      
      if (currentPermission === "granted") {
        setSettings(prev => ({ ...prev, pushNotifications: true }));
        toast.success("Notifications push activées !");
      } else if (currentPermission === "default") {
        // Permission was reset, try requesting again
        requestPushPermission(true);
      } else {
        toast.info("Permission toujours refusée. Vérifiez les paramètres de votre navigateur.");
      }
    }
  };

  const { data: settingsData, isLoading } = useQuery<{ settings: NotificationSettings }>({
    queryKey: ["/api/notification-settings"],
    retry: false
  });
  
  const notificationSettings = settingsData?.settings;

  useEffect(() => {
    if (notificationSettings) {
      setSettings({
        milestoneReminders: notificationSettings.milestoneReminders,
        weeklyDigest: notificationSettings.weeklyDigest,
        monthlyRecap: notificationSettings.monthlyRecap,
        birthdayReminders: notificationSettings.birthdayReminders,
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications,
        reminderDays: notificationSettings.reminderDays
      });
      
      const pendingSettings = localStorage.getItem("pendingNotificationSettings");
      if (pendingSettings) {
        localStorage.removeItem("pendingNotificationSettings");
      }
    } else {
      const pendingSettings = localStorage.getItem("pendingNotificationSettings");
      if (pendingSettings) {
        try {
          const parsed = JSON.parse(pendingSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Error parsing pending notification settings:", e);
        }
      }
    }
  }, [notificationSettings]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: typeof settings) => {
      const response = await apiRequest("PATCH", "/api/notification-settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      setShowSuccess(true);
      setTimeout(() => {
        setLocation("/app");
      }, 1500);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const notificationTypes = [
    {
      key: "milestoneReminders",
      icon: Star,
      title: "Rappels de jalons",
      description: "Premier sourire, premiers pas, premières dents..."
    },
    {
      key: "weeklyDigest",
      icon: Calendar,
      title: "Résumé hebdomadaire",
      description: "Un récapitulatif de la semaine chaque dimanche"
    },
    {
      key: "monthlyRecap",
      icon: Baby,
      title: "Mensiversaire",
      description: "Célébrez chaque mois de vie de votre enfant"
    },
    {
      key: "birthdayReminders",
      icon: Cake,
      title: "Anniversaires",
      description: "Rappels pour les anniversaires importants"
    }
  ];

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-stone-100 p-4 flex items-center justify-between">
          <Link href="/app">
            <button className="p-2 hover:bg-stone-100 rounded-full -ml-2" data-testid="button-back-notifications">
              <ChevronLeft className="text-stone-800" />
            </button>
          </Link>
          <h1 className="text-lg font-serif font-bold text-stone-800">Notifications</h1>
          <div className="w-10" />
        </div>

        <div className="p-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell size={32} className="text-primary" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center text-stone-500 text-sm mb-8"
          >
            Configurez vos rappels pour ne jamais manquer un moment précieux de la vie de votre enfant.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-1"
          >
            <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wider px-1">
              Types de rappels
            </h2>
            <div className="bg-stone-50 rounded-xl divide-y divide-stone-100">
              {notificationTypes.map((item, index) => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <item.icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{item.title}</p>
                      <p className="text-xs text-stone-500">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, [item.key]: checked })
                    }
                    data-testid={`switch-${item.key}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1"
          >
            <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wider px-1">
              Mode de livraison
            </h2>
            <div className="bg-stone-50 rounded-xl divide-y divide-stone-100">
              {/* Email notifications */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Bell size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 text-sm">Notifications par email</p>
                    <p className="text-xs text-stone-500">Recevez les rappels dans votre boîte mail</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                  data-testid="switch-emailNotifications"
                />
              </div>
              
              {/* Push notifications with permission request */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Camera size={18} className={settings.pushNotifications ? "text-primary" : "text-stone-400"} />
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 text-sm">Notifications push</p>
                      <p className="text-xs text-stone-500">
                        {pushPermissionStatus === "denied" 
                          ? "Permission refusée - activez dans les paramètres"
                          : pushPermissionStatus === "unsupported"
                          ? "Non supporté sur cet appareil"
                          : pushPermissionStatus === "granted"
                          ? "Notifications activées sur cet appareil"
                          : "Notifications instantanées sur votre appareil"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={requestPushPermission}
                    disabled={pushPermissionStatus === "denied" || pushPermissionStatus === "unsupported"}
                    data-testid="switch-pushNotifications"
                  />
                </div>
                {pushPermissionStatus === "denied" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>Pour activer les notifications, allez dans les paramètres de votre navigateur et autorisez les notifications pour ce site.</span>
                    </div>
                    <button 
                      onClick={retryPushPermission}
                      className="text-xs text-primary hover:underline font-medium"
                      data-testid="button-retry-push"
                    >
                      J'ai modifié les paramètres, réessayer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="pt-4"
          >
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || showSuccess}
              className="w-full h-12 bg-primary hover:bg-primary/90"
              data-testid="button-save-notifications"
            >
              {showSuccess ? (
                <>
                  <Check size={18} className="mr-2" />
                  Sauvegardé!
                </>
              ) : saveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </motion.div>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 text-center"
            >
              <Check size={24} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">
                Vos préférences ont été sauvegardées!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Redirection en cours...
              </p>
            </motion.div>
          )}

          {saveMutation.isError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
            >
              <p className="text-sm text-red-700 font-medium">
                Une erreur s'est produite. Veuillez réessayer.
              </p>
            </motion.div>
          )}

          {videoStorage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-purple-200 mt-6"
            >
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <Video size={16} className="text-purple-600" />
                Espace vidéo
              </h3>
              
              {videoStorage.canUploadVideos ? (
                <>
                  <div className="flex justify-between text-xs text-stone-600 mb-2">
                    <span>{videoStorage.videoUsedGb} Go utilisés</span>
                    <span>{videoStorage.videoLimitGb} Go disponibles</span>
                  </div>
                  <Progress 
                    value={videoStorage.percentageUsed} 
                    className="h-2 mb-2"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-stone-500">
                      {videoStorage.remainingGb} Go restants
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      videoStorage.percentageUsed >= 90 
                        ? 'bg-red-100 text-red-700' 
                        : videoStorage.percentageUsed >= 70 
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {videoStorage.percentageUsed}% utilisé
                    </span>
                  </div>
                  {videoStorage.percentageUsed >= 90 && (
                    <p className="text-xs text-red-600 mt-2">
                      Attention : votre espace vidéo est presque plein. Supprimez des vidéos pour libérer de l'espace.
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-2">
                  <HardDrive size={24} className="text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 mb-1">
                    Stockage vidéo non disponible
                  </p>
                  <p className="text-xs text-stone-500">
                    Passez à Premium (2 Go) ou Platine (5 Go) pour télécharger des vidéos.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-stone-50 rounded-xl p-4 border border-stone-200 mt-6"
          >
            <h3 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-2">
              <Mail size={16} className="text-amber-600" />
              Nous contacter
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Une question, une suggestion ou besoin d'aide ? Écrivez-nous !
            </p>
            <a
              href="mailto:memo.app.25@hotmail.com"
              className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-medium transition-colors"
              data-testid="link-contact-email"
            >
              <Mail size={14} />
              memo.app.25@hotmail.com
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
