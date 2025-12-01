import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Bell, Save, Check, Calendar, Baby, Cake, Camera, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    milestoneReminders: true,
    weeklyDigest: true,
    monthlyRecap: true,
    birthdayReminders: true,
    emailNotifications: true,
    pushNotifications: false,
    reminderDays: 1
  });

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

  const deliveryMethods = [
    {
      key: "emailNotifications",
      icon: Bell,
      title: "Notifications par email",
      description: "Recevez les rappels dans votre boîte mail"
    },
    {
      key: "pushNotifications",
      icon: Camera,
      title: "Notifications push",
      description: "Notifications instantanées sur votre appareil"
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
              {deliveryMethods.map((item) => (
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
        </div>
      </div>
    </div>
  );
}
