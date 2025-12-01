import { useState } from "react";
import { Bell, X, Check, Baby, Heart, Star, Cake, Camera, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Notification } from "@shared/schema";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  bell: Bell,
  baby: Baby,
  heart: Heart,
  star: Star,
  cake: Cake,
  camera: Camera,
};

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", { credentials: "include" });
      if (!response.ok) return { notifications: [], unreadCount: 0 };
      return response.json();
    },
    refetchInterval: 60000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/dismiss`, {
        method: "PATCH",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
        data-testid="button-notifications"
      >
        <Bell size={22} className="text-stone-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                    data-testid="button-mark-all-read"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-stone-400">
                    <Clock className="mx-auto mb-2 animate-pulse" size={24} />
                    <p className="text-sm">Chargement...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Bell className="mx-auto mb-2 opacity-40" size={32} />
                    <p className="text-sm">Aucune notification</p>
                    <p className="text-xs mt-1">Vos rappels apparaîtront ici</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const Icon = iconMap[notification.icon || "bell"] || Bell;
                      const triggerDate = new Date(notification.triggerDate);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`relative p-4 border-b border-stone-50 hover:bg-stone-50 cursor-pointer transition-colors ${
                            !notification.isRead ? "bg-primary/5" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.type === "anniversary" 
                                ? "bg-amber-100 text-amber-600"
                                : "bg-primary/10 text-primary"
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`font-medium text-sm ${!notification.isRead ? "text-stone-900" : "text-stone-700"}`}>
                                  {notification.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissMutation.mutate(notification.id);
                                  }}
                                  className="p-1 hover:bg-stone-200 rounded-full transition-colors"
                                  data-testid={`dismiss-notification-${notification.id}`}
                                >
                                  <X size={14} className="text-stone-400" />
                                </button>
                              </div>
                              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-stone-400">
                                  {formatRelativeDate(triggerDate)}
                                </span>
                                {!notification.isRead && (
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-stone-100 bg-stone-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-stone-600 hover:text-stone-900"
                    onClick={() => {
                      setLocation("/app/notifications");
                      setIsOpen(false);
                    }}
                    data-testid="button-view-all-notifications"
                  >
                    Voir toutes les notifications
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
