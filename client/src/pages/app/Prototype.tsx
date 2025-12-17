import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Minus, Image as ImageIcon, Mic, Video, MoreHorizontal, Calendar, Share2, BookOpen, Printer, CheckCircle, Bell, QrCode, Baby, LogOut, Settings, User, Sparkles, ShoppingBag, FolderHeart, Trash2, Crown, Mail, Phone, MapPin, UserPlus, Users, Edit2, CreditCard, X, Lock, Search, Clock, AlertTriangle, Gift, Loader2, Camera, ArrowUp, ArrowDown, Shield, TrendingUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Book, TemplatePage, UserBookPage, TemplatePart, BookTemplate } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/NotificationBell";
import { PageThumbnail, PageThumbnailSkeleton } from "@/components/book";

export default function Prototype() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";
  const [activeTab, setActiveTab] = useState("creations");
  const [showNotification, setShowNotification] = useState(true);
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(0);
  const [bookPages, setBookPages] = useState([
    { id: 1, type: "cover", title: "Couverture", image: "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop" },
    { id: 2, type: "birth", title: "Naissance", date: "12 Jan 2025", stats: { poids: "3.4 kg", taille: "51 cm", heure: "04:23" } },
    { id: 3, type: "photo", title: "Première rencontre", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop", desc: "Le moment magique" },
    { id: 4, type: "milestone", title: "Premiers pas", date: "15 Oct 2025", desc: "Ça y est ! Il s'est lancé !" },
    { id: 5, type: "photo", title: "Fous rires", image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop", desc: "Dans le bain" },
  ]);
  
  const babyName = typeof window !== "undefined" ? localStorage.getItem("babyName") || "Léo" : "Léo";
  const language = typeof window !== "undefined" ? (localStorage.getItem("language") || "fr") : "fr";
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "inspiration") {
        setActiveTab("inspiration");
        window.history.replaceState({}, "", window.location.pathname);
      } else if (tab === "order") {
        setActiveTab("order");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);
  
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        const newPage = {
          id: Date.now() + i,
          type: "photo" as const,
          title: "Nouveau souvenir",
          image: dataUrl,
          desc: "Ajouté le " + new Date().toLocaleDateString("fr-FR")
        };
        
        setBookPages(prev => [...prev, newPage]);
      }
    }
    
    setIsUploading(false);
    setShowPhotoModal(false);
  };
  
  const queryClient = useQueryClient();
  const [activeBookId, setActiveBookId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeBookId");
    }
    return null;
  });
  
  const { data: booksData, isLoading: booksLoading } = useQuery<{ books: Book[] }>({
    queryKey: ["/api/books"],
    queryFn: async () => {
      const response = await fetch("/api/books", { credentials: "include" });
      if (!response.ok) return { books: [] };
      return response.json();
    },
  });
  
  const [localBooks, setLocalBooks] = useState<Array<{
    id: string;
    childName: string;
    babyStatus: string;
    babyGender: string;
    birthDate: string;
    createdAt: string;
    coverImage?: string;
    synced?: boolean;
  }>>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("localBooks") || "[]");
    }
    return [];
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedThisSession, setHasSyncedThisSession] = useState(false);
  
  useEffect(() => {
    const syncLocalBooks = async () => {
      if (localBooks.length === 0 || isSyncing || hasSyncedThisSession) return;
      
      const unsyncedBooks = localBooks.filter(b => !b.synced);
      if (unsyncedBooks.length === 0) {
        localStorage.setItem("localBooks", "[]");
        setLocalBooks([]);
        return;
      }
      
      setIsSyncing(true);
      setHasSyncedThisSession(true);
      const successfullySynced: string[] = [];
      const alreadyExistsOnServer: string[] = [];
      const serverBooks = booksData?.books || [];
      
      for (const book of unsyncedBooks) {
        const existsOnServer = serverBooks.some(sb => 
          sb.childName === book.childName && 
          sb.babyStatus === book.babyStatus &&
          sb.birthDate && new Date(sb.birthDate).toDateString() === new Date(book.birthDate).toDateString()
        );
        
        if (existsOnServer) {
          alreadyExistsOnServer.push(book.id);
          continue;
        }
        
        try {
          const response = await fetch("/api/books", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              childName: book.childName,
              babyStatus: book.babyStatus,
              babyGender: book.babyGender,
              birthDate: new Date(book.birthDate).toISOString(),
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            successfullySynced.push(book.id);
            if (localStorage.getItem("activeBookId") === book.id) {
              localStorage.setItem("activeBookId", data.book.id);
              setActiveBookId(data.book.id);
            }
          }
        } catch (error) {
          console.error("Error syncing book:", error);
        }
      }
      
      const toRemove = [...successfullySynced, ...alreadyExistsOnServer];
      if (toRemove.length > 0) {
        const remainingBooks = localBooks.filter(b => !toRemove.includes(b.id));
        localStorage.setItem("localBooks", JSON.stringify(remainingBooks));
        setLocalBooks(remainingBooks);
        if (successfullySynced.length > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/books"] });
        }
      }
      
      setIsSyncing(false);
    };
    
    if (booksData && booksData.books !== undefined) {
      syncLocalBooks();
    }
  }, [booksData]);
  
  const apiBooks = booksData?.books || [];
  const allBooks = [
    ...apiBooks.map(b => ({ ...b, isLocal: false })),
    ...localBooks.map(b => ({ ...b, isLocal: true, userId: "" }))
  ];
  const userBooks = allBooks;
  const activeBook = userBooks.find(b => b.id === activeBookId) || userBooks[0];
  
  const isPrebuiltBook = !!(activeBook && 'templateSlug' in activeBook && activeBook.templateSlug && activeBook.templateSlug !== 'custom');
  
  const { data: prebuiltPagesData, isLoading: prebuiltPagesLoading } = useQuery<{
    pages: UserBookPage[];
    template: BookTemplate | null;
    templateParts: TemplatePart[] | null;
    templatePages: TemplatePage[] | null;
    book: Book;
  }>({
    queryKey: ["/api/books", activeBook?.id, "pages"],
    queryFn: async () => {
      const res = await fetch(`/api/books/${activeBook?.id}/pages`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load book pages");
      return res.json();
    },
    enabled: !!activeBook?.id && isPrebuiltBook,
  });

  const setActiveBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      localStorage.setItem("activeBookId", bookId);
      setActiveBookId(bookId);
      const book = userBooks.find(b => b.id === bookId);
      if (book) {
        localStorage.setItem("babyName", book.childName);
        localStorage.setItem("babyStatus", book.babyStatus || "");
        localStorage.setItem("babyGender", book.babyGender || "");
        const birthDateStr = typeof book.birthDate === 'string' 
          ? book.birthDate.split("T")[0] 
          : book.birthDate ? new Date(book.birthDate).toISOString().split("T")[0] : "";
        if (birthDateStr) {
          localStorage.setItem("babyDate", birthDateStr);
          localStorage.setItem("babyBirthDate", birthDateStr);
        }
      }
      return bookId;
    },
  });

  const [userPlan, setUserPlan] = useState<"base" | "premium" | "platine">("base");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{
    moisEcoules: number;
    montantDu: string;
    montantPaye: string;
    differenceImmediate: string;
    tarifNouveau: string;
    fromPlan: string;
    toPlan: string;
  } | null>(null);
  const [isCalculatingUpgrade, setIsCalculatingUpgrade] = useState(false);
  
  const typedUser = user as {
    requiresSubscription?: boolean;
    trialExpired?: boolean;
    trialDaysLeft?: number;
    hasSubscription?: boolean;
    currentPlan?: string;
  } | null;
  
  const trialDaysLeft = typedUser?.trialDaysLeft ?? 14;
  const requiresSubscription = typedUser?.requiresSubscription ?? false;
  const isTrialActive = trialDaysLeft > 0 && !requiresSubscription;
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  
  useEffect(() => {
    if (requiresSubscription) {
      setShowTrialExpiredModal(true);
    }
  }, [requiresSubscription]);
  const [showBookSelectorModal, setShowBookSelectorModal] = useState(false);
  const [pendingInspirationPage, setPendingInspirationPage] = useState<{title: string, icon: string, color: string} | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedBookForInsert, setSelectedBookForInsert] = useState<string | null>(null);
  const [bookPagesForInsert, setBookPagesForInsert] = useState<any[]>([]);
  
  const [pageAddedFeedback, setPageAddedFeedback] = useState<{bookName: string, pageTitle: string} | null>(null);
  const [showDeleteBookModal, setShowDeleteBookModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{id: string, childName: string, isLocal: boolean} | null>(null);
  
  const handleDeleteBook = (book: {id: string, childName: string, isLocal?: boolean}) => {
    setBookToDelete({ id: book.id, childName: book.childName, isLocal: book.isLocal || false });
    setShowDeleteBookModal(true);
  };
  
  const handleCalculateUpgrade = async (fromPlan: string, toPlan: string) => {
    setIsCalculatingUpgrade(true);
    try {
      const res = await fetch("/api/subscription/calculate-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fromPlan, toPlan }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUpgradeData(data);
        setShowUpgradeModal(true);
      } else {
        console.error("Failed to calculate upgrade");
        setSelectedProduct({ name: toPlan === "platine" ? "Platine" : "Premium", price: toPlan === "platine" ? "4,99$/mois" : "1,99$/mois" });
        setShowCheckout(true);
      }
    } catch (error) {
      console.error("Error calculating upgrade:", error);
      setSelectedProduct({ name: toPlan === "platine" ? "Platine" : "Premium", price: toPlan === "platine" ? "4,99$/mois" : "1,99$/mois" });
      setShowCheckout(true);
    } finally {
      setIsCalculatingUpgrade(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeData) return;
    
    setSelectedProduct({
      name: upgradeData.toPlan === "platine" ? "Platine" : "Premium",
      price: `${upgradeData.tarifNouveau}$/mois`,
      upgradeAdjustment: parseFloat(upgradeData.differenceImmediate),
    });
    setShowUpgradeModal(false);
    setShowCheckout(true);
  };
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      let deleteSuccess = false;
      
      if (bookToDelete.isLocal) {
        const updatedLocalBooks = localBooks.filter(b => b.id !== bookToDelete.id);
        localStorage.setItem("localBooks", JSON.stringify(updatedLocalBooks));
        setLocalBooks(updatedLocalBooks);
        deleteSuccess = true;
      } else {
        const response = await fetch(`/api/books/${bookToDelete.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        
        if (response.ok) {
          await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
          deleteSuccess = true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Erreur lors de la suppression");
        }
      }
      
      if (deleteSuccess) {
        if (activeBookId === bookToDelete.id) {
          const currentApiBooks = queryClient.getQueryData<{ books: any[] }>(["/api/books"])?.books || [];
          const currentLocalBooks = JSON.parse(localStorage.getItem("localBooks") || "[]");
          const allRemainingBooks = [...currentApiBooks, ...currentLocalBooks].filter(b => b.id !== bookToDelete.id);
          
          if (allRemainingBooks.length > 0) {
            setActiveBookMutation.mutate(allRemainingBooks[0].id);
          } else {
            localStorage.removeItem("activeBookId");
            setActiveBookId(null);
          }
        }
        
        setShowDeleteBookModal(false);
        setBookToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      setDeleteError(error instanceof Error ? error.message : "Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleAddInspirationPage = (page: {title: string, icon: string, color: string}) => {
    if (userBooks.length > 1) {
      setPendingInspirationPage(page);
      setShowBookSelectorModal(true);
    } else if (userBooks.length === 1) {
      selectBookForInsert(page, userBooks[0].id);
    } else {
      addPageToBook(page, null, 0);
    }
  };
  
  const selectBookForInsert = (page: {title: string, icon: string, color: string}, bookId: string) => {
    setPendingInspirationPage(page);
    setSelectedBookForInsert(bookId);
    setShowBookSelectorModal(false);
    
    if (bookId && bookId !== activeBookId) {
      setActiveBookMutation.mutate(bookId);
    }
    
    setBookPagesForInsert(bookPages);
    setShowPositionModal(true);
  };
  
  const addPageToBook = async (page: {title: string, icon: string, color: string}, bookId: string | null, position: number) => {
    const targetBookId = bookId || activeBookId;
    const targetBook = bookId ? userBooks.find(b => b.id === bookId) : activeBook;
    const bookName = targetBook?.childName || "votre livre";
    
    if (bookId && bookId !== activeBookId) {
      setActiveBookMutation.mutate(bookId);
    }
    
    const newPage = {
      id: Date.now(),
      type: "inspiration",
      title: page.title,
      desc: "Ajoutez votre contenu ici...",
      date: "",
      image: "",
      stats: undefined
    };
    
    const newPages = [...bookPages];
    newPages.splice(position, 0, newPage as any);
    setBookPages(newPages);
    setCurrentPage(position);
    
    setShowBookSelectorModal(false);
    setShowPositionModal(false);
    setPendingInspirationPage(null);
    setSelectedBookForInsert(null);
    setBookPagesForInsert([]);
    
    setPageAddedFeedback({ bookName, pageTitle: page.title });
    setTimeout(() => setPageAddedFeedback(null), 3000);
    
    setActiveTab("creations");
  };
  
  // Initialize userPlan from server data
  useEffect(() => {
    if (typedUser?.currentPlan) {
      const planMap: Record<string, "base" | "premium" | "platine"> = {
        "free": "base",
        "premium": "premium",
        "platine": "platine"
      };
      const mappedPlan = planMap[typedUser.currentPlan] || "base";
      setUserPlan(mappedPlan);
    }
  }, [typedUser?.currentPlan]);
  
  // Only show trial expired modal if user has no subscription AND trial expired
  useEffect(() => {
    // Don't show modal if user already has a subscription (hasSubscription = true means they have a plan in the database)
    if (typedUser?.hasSubscription) {
      setShowTrialExpiredModal(false);
      return;
    }
    // Show modal only if trial expired and no subscription
    if (!isTrialActive && !typedUser?.hasSubscription) {
      setShowTrialExpiredModal(true);
    }
  }, [isTrialActive, typedUser?.hasSubscription]);
  
  const [userInfo, setUserInfo] = useState(() => {
    if (typeof window !== "undefined") {
      return {
        name: localStorage.getItem("userName") || "Marie Dupond-Martin",
        email: localStorage.getItem("userEmail") || "marie@example.com",
        phone: localStorage.getItem("userPhone") || "+1 (514) 555-1234",
        address: localStorage.getItem("userAddress") || "123 Rue des Érables, Montréal, QC",
        gender: localStorage.getItem("userGender") || "Femme"
      };
    }
    return {
      name: "Marie Dupond-Martin",
      email: "marie@example.com",
      phone: "+1 (514) 555-1234",
      address: "123 Rue des Érables, Montréal, QC",
      gender: "Femme"
    };
  });
  const [invitedUsers, setInvitedUsers] = useState([
    { id: 1, name: "Jean Martin", email: "jean@example.com" }
  ]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [showAddPageMenu, setShowAddPageMenu] = useState(false);
  const [bookStyle, setBookStyle] = useState<"moderne" | "classique" | "colore" | "animation">("moderne");
  const [previewStyle, setPreviewStyle] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showManageSubscription, setShowManageSubscription] = useState(false);
  const [showCancelSubscription, setShowCancelSubscription] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{name: string, price: string, upgradeAdjustment?: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });
  const [inspirationSearch, setInspirationSearch] = useState("");
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null);
  const [showNotificationBubble, setShowNotificationBubble] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("notificationBubbleDismissed");
    }
    return true;
  });
  const [showNotificationInstructions, setShowNotificationInstructions] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  // Order configuration state
  const [showOrderConfigModal, setShowOrderConfigModal] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<"softcover" | "hardcover" | "ebook" | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedBooksForOrder, setSelectedBooksForOrder] = useState<string[]>([]);

  // Baby info editing state
  const [isEditingBabyInfo, setIsEditingBabyInfo] = useState(false);
  const [editBabyName, setEditBabyName] = useState("");
  const [editBabyGender, setEditBabyGender] = useState<"garcon" | "fille" | "neutre">("neutre");
  const [editBabyDate, setEditBabyDate] = useState("");
  const [isSavingBabyInfo, setIsSavingBabyInfo] = useState(false);

  const startEditingBabyInfo = () => {
    setEditBabyName(activeBook?.childName || "");
    setEditBabyGender((activeBook?.babyGender as "garcon" | "fille" | "neutre") || "neutre");
    const dateStr = activeBook?.birthDate 
      ? new Date(activeBook.birthDate).toISOString().split("T")[0]
      : "";
    setEditBabyDate(dateStr);
    setIsEditingBabyInfo(true);
  };

  const saveBabyInfo = async () => {
    if (!activeBook?.id || activeBook.isLocal) return;
    
    setIsSavingBabyInfo(true);
    try {
      const response = await fetch(`/api/books/${activeBook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childName: editBabyName,
          babyGender: editBabyGender,
          birthDate: editBabyDate ? new Date(editBabyDate).toISOString() : null,
        }),
      });
      
      if (response.ok) {
        // Update localStorage for sync
        localStorage.setItem("babyName", editBabyName);
        localStorage.setItem("babyGender", editBabyGender);
        if (editBabyDate) {
          localStorage.setItem("babyDate", editBabyDate);
          localStorage.setItem("babyBirthDate", editBabyDate);
        } else {
          localStorage.removeItem("babyDate");
          localStorage.removeItem("babyBirthDate");
        }
        // Refresh book data
        await queryClient.invalidateQueries({ queryKey: ["/api/books"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/books", activeBook.id, "pages"] });
        setIsEditingBabyInfo(false);
      } else {
        alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
      }
    } catch (error) {
      console.error("Error saving baby info:", error);
      alert("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSavingBabyInfo(false);
    }
  };

  // Tutorial system
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("tutorialCompleted");
    }
    return true;
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const tutorialSteps = [
    {
      id: "welcome",
      title: "Bienvenue sur Memoria!",
      description: "Je vais vous guider à travers les fonctionnalités principales pour créer votre premier livre de souvenirs.",
      icon: "👋",
      target: null
    },
    {
      id: "dashboard",
      title: "Votre tableau de bord",
      description: "Ici, vous voyez tous vos livres et votre activité récente. Cliquez sur un livre pour l'éditer.",
      icon: "📊",
      target: "dashboard"
    },
    {
      id: "add-photo",
      title: "Ajouter des souvenirs",
      description: "Utilisez les boutons rapides pour ajouter des photos, vidéos ou étapes importantes à votre livre.",
      icon: "📸",
      target: "quick-actions"
    },
    {
      id: "inspiration",
      title: "Pages d'inspiration",
      description: "Explorez notre bibliothèque de pages prêtes à l'emploi: annonce de grossesse, échographies, et plus encore!",
      icon: "✨",
      target: "inspiration"
    },
    {
      id: "order",
      title: "Commander votre livre",
      description: "Une fois votre livre prêt, commandez-le en version imprimée ou numérique avec codes QR pour les vidéos!",
      icon: "📖",
      target: "order"
    },
    {
      id: "complete",
      title: "Vous êtes prêt!",
      description: "Vous savez maintenant utiliser Memoria. Commencez à créer des souvenirs inoubliables!",
      icon: "🎉",
      target: null
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
      // Navigate to relevant tab if needed
      if (tutorialSteps[tutorialStep + 1].target === "inspiration") {
        setActiveTab("inspiration");
      } else if (tutorialSteps[tutorialStep + 1].target === "order") {
        setActiveTab("order");
      } else if (tutorialSteps[tutorialStep + 1].target === "dashboard" || tutorialSteps[tutorialStep + 1].target === "quick-actions") {
        setActiveTab("creations");
      }
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("tutorialCompleted", "true");
  };

  const restartTutorial = () => {
    setTutorialStep(0);
    setActiveTab("creations");
    setShowTutorial(true);
    localStorage.removeItem("tutorialCompleted");
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      setShowNotificationInstructions(true);
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission as any);
    
    if (permission === "granted") {
      localStorage.setItem("notificationsEnabled", "true");
      localStorage.setItem("notificationBubbleDismissed", "true");
      setShowNotificationBubble(false);
    } else if (permission === "denied") {
      setShowNotificationInstructions(true);
    }
  };

  const handleSelectProduct = (productType: "softcover" | "hardcover" | "ebook") => {
    // Show order configuration modal
    setSelectedProductType(productType);
    setOrderQuantity(1);
    // Pre-select the active book if there is one
    setSelectedBooksForOrder(activeBookId ? [activeBookId] : []);
    setShowOrderConfigModal(true);
  };
  
  const handleConfirmOrder = () => {
    if (selectedBooksForOrder.length === 0) return;
    // Navigate to checkout with selected books and quantity
    const bookIds = selectedBooksForOrder.join(",");
    setLocation(`/app/test-checkout?bookId=${bookIds}&quantity=${orderQuantity}&product=${selectedProductType}`);
    setShowOrderConfigModal(false);
  };

  const addInvitedUser = () => {
    if (newUserName && newUserEmail) {
      setInvitedUsers([...invitedUsers, { id: Date.now(), name: newUserName, email: newUserEmail }]);
      setNewUserName("");
      setNewUserEmail("");
      setShowAddUser(false);
    }
  };

  const removeInvitedUser = (id: number) => {
    setInvitedUsers(invitedUsers.filter(u => u.id !== id));
  };

  const addBasicPage = () => {
    const newPage = {
      id: Date.now(),
      type: "basic",
      title: `Nouvelle page`,
      desc: "Ajoutez votre texte ici...",
      date: "",
      image: "",
      stats: undefined
    };
    setBookPages([...bookPages, newPage as any]);
    setCurrentPage(bookPages.length);
    setShowAddPageMenu(false);
  };

  const goToInspiration = () => {
    setActiveTab('inspiration');
    setShowAddPageMenu(false);
  };

  const deletePage = () => {
    if (bookPages.length > 1 && currentPage > 0) {
      const newPages = bookPages.filter((_, idx) => idx !== currentPage);
      setBookPages(newPages);
      setCurrentPage(Math.max(0, currentPage - 1));
    }
  };

  const nextPage = () => {
    if (currentPage < bookPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate baby age or pregnancy progress for notifications
  const getAgeNotificationText = () => {
    const birthDateStr = activeBook?.birthDate;
    const status = activeBook?.babyStatus;
    
    if (!birthDateStr) {
      return { title: `${babyName} grandit ! 🎉`, subtitle: "C'est le moment idéal pour capturer un souvenir." };
    }
    
    // Parse dates and normalize to midnight for accurate day calculation
    const birthDate = new Date(birthDateStr);
    birthDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (status === "enceinte") {
      // For pregnancy: calculate weeks since start date
      const diffTime = now.getTime() - birthDate.getTime();
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      if (diffWeeks < 0) {
        return { title: `Grossesse en cours ! 🤰`, subtitle: "Documentez cette belle aventure." };
      } else if (diffWeeks === 0) {
        return { title: `Début de grossesse ! 🤰`, subtitle: "Une nouvelle aventure commence." };
      } else if (diffWeeks < 13) {
        return { title: `${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''} de grossesse ! 🤰`, subtitle: "Premier trimestre - une période magique à documenter." };
      } else if (diffWeeks < 27) {
        return { title: `${diffWeeks} semaines de grossesse ! 🤰`, subtitle: "Deuxième trimestre - bébé grandit vite !" };
      } else {
        return { title: `${diffWeeks} semaines de grossesse ! 🤰`, subtitle: "Dernier trimestre - la rencontre approche !" };
      }
    } else {
      // For born babies: calculate age in days/weeks/months/years
      const diffTime = now.getTime() - birthDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30.44);
      const diffYears = Math.floor(diffMonths / 12);
      
      if (diffDays < 0) {
        return { title: `${babyName} arrive bientôt ! 👶`, subtitle: "Préparez-vous à capturer ses premiers moments." };
      } else if (diffDays === 0) {
        return { title: `${babyName} est né aujourd'hui ! 🎉`, subtitle: "Bienvenue au monde ! Capturez ce moment magique." };
      } else if (diffDays === 1) {
        return { title: `${babyName} a 1 jour aujourd'hui ! 🎉`, subtitle: "Chaque jour est précieux à documenter." };
      } else if (diffDays < 7) {
        return { title: `${babyName} a ${diffDays} jours ! 🎉`, subtitle: "Chaque jour est précieux à documenter." };
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return { title: `${babyName} a ${weeks} semaine${weeks > 1 ? 's' : ''} ! 🎉`, subtitle: "Ces premiers jours passent si vite !" };
      } else if (diffMonths < 12) {
        return { title: `${babyName} a ${diffMonths} mois aujourd'hui ! 🎉`, subtitle: "C'est le moment idéal pour prendre une photo de son évolution." };
      } else if (diffYears === 1) {
        const remainingMonths = diffMonths % 12;
        if (remainingMonths === 0) {
          return { title: `${babyName} a 1 an aujourd'hui ! 🎂`, subtitle: "Joyeux anniversaire ! Un an de beaux souvenirs." };
        }
        return { title: `${babyName} a 1 an et ${remainingMonths} mois ! 🎉`, subtitle: "Le temps passe si vite, capturez ces moments." };
      } else {
        const remainingMonths = diffMonths % 12;
        if (remainingMonths === 0) {
          return { title: `${babyName} a ${diffYears} ans ! 🎂`, subtitle: "Joyeux anniversaire !" };
        }
        return { title: `${babyName} a ${diffYears} ans et ${remainingMonths} mois ! 🎉`, subtitle: "Continuez à documenter ces beaux moments." };
      }
    }
  };
  
  const ageNotification = getAgeNotificationText();

  const memories = [
    {
      id: 0,
      type: "birth",
      date: "12 Jan 2025",
      title: "Bienvenue Léo !",
      isBirthCard: true,
      stats: {
        weight: "3.4 kg",
        height: "51 cm",
        time: "04:23"
      }
    },
    {
      id: 1,
      type: "photo",
      date: "27 Nov 2025",
      title: "Première rencontre",
      desc: "Le moment magique où Léo a rencontré sa petite sœur pour la première fois. Il était si doux !",
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      type: "milestone",
      date: "15 Oct 2025",
      title: "Premiers pas",
      desc: "Ça y est ! Après des semaines d'hésitation, il s'est lancé vers le canapé.",
      accent: "bg-secondary/20 text-secondary-foreground"
    },
    {
      id: 3,
      type: "video",
      date: "02 Sept 2025",
      title: "Fous rires dans le bain",
      desc: "Impossible d'arrêter de rire avec les éclaboussures.",
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop",
      isVideo: true
    }
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center items-center p-4 md:p-8">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[400px] h-[850px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-stone-900 relative flex flex-col">
        
        {/* Status Bar Area */}
        <div className="h-8 bg-stone-900 w-full flex justify-center items-end pb-1">
            <div className="w-24 h-4 bg-black rounded-full"></div>
        </div>

        {/* Smart Notification Mockup */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-12 left-4 right-4 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl p-4 z-50 border border-stone-100 cursor-pointer"
              onClick={() => setShowNotification(false)}
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bell size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-stone-900">{ageNotification.title}</h4>
                  <p className="text-xs text-stone-500 mt-1">{ageNotification.subtitle}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification Bubble Tooltip */}
        <AnimatePresence>
          {showNotificationBubble && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute top-12 right-4 z-40"
            >
              <div className="bg-primary text-white rounded-2xl p-3 shadow-lg max-w-[200px] relative">
                <button 
                  onClick={() => {
                    localStorage.setItem("notificationBubbleDismissed", "true");
                    setShowNotificationBubble(false);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
                >
                  <X size={12} className="text-stone-600" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={14} className="text-white" />
                  <span className="text-xs font-bold">Activez les notifications!</span>
                </div>
                <p className="text-[10px] text-white/90 leading-relaxed">
                  Recevez des rappels pour capturer les moments importants
                </p>
                <div className="absolute -bottom-2 right-6 w-3 h-3 bg-primary rotate-45"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Header */}
        <div className="p-6 pb-4 bg-white z-10 flex justify-between items-center">
          <Link href="/">
            <button className="p-2 hover:bg-stone-50 rounded-full -ml-2">
              <ChevronLeft className="text-stone-800" />
            </button>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-serif font-bold text-stone-800">Livre de {babyName}</h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-stone-50 rounded-full">
                  <MoreHorizontal className="text-stone-800" />
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setLocation("/app/profile")}
              >
                <User size={16} className="mr-2" />
                <span>Mon Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setLocation("/app/notifications")}
              >
                <Bell size={16} className="mr-2" />
                <span>Notifications</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-primary"
                    onClick={() => setLocation("/app/admin")}
                    data-testid="menu-admin"
                  >
                    <Shield size={16} className="mr-2" />
                    <span>Espace Administrateur</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={() => setLocation("/")}
              >
                <LogOut size={16} className="mr-2" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-stone-50 relative">
          {/* Hero Cover of the Book */}
          <Link href={activeBook 
              ? ('templateSlug' in activeBook && activeBook.templateSlug && activeBook.templateSlug !== 'custom' 
                  ? `/app/book/${activeBook.id}/prebuilt` 
                  : `/app/book/${activeBook.id}/edit`)
              : "/app/edit"}>
            <button className="w-full h-48 bg-stone-200 relative hover:opacity-80 transition-opacity cursor-pointer" data-testid="button-open-book">
              <img 
                src={activeBook?.coverImage || "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop"} 
                className="w-full h-full object-cover opacity-90" 
                alt="Cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 text-white">
                <p className="text-xs font-medium opacity-80">Commencé le 12 Janvier 2025</p>
                <h2 className="text-2xl font-serif font-bold">L'histoire de {babyName}</h2>
              </div>
            </button>
          </Link>

          {/* Stats / Actions */}
          <div className="flex justify-between items-center p-4 px-6 bg-white border-b border-stone-100">
            <div className="text-center">
              <span className="block text-lg font-bold text-stone-800" data-testid="stat-souvenirs">{memories.length + bookPages.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Souvenirs</span>
            </div>
            <div className="h-8 w-px bg-stone-100"></div>
            <div className="text-center">
              <span className="block text-lg font-bold text-stone-800" data-testid="stat-mois">
                {(() => {
                  const birthDateStr = typeof window !== "undefined" ? localStorage.getItem("babyBirthDate") : null;
                  if (birthDateStr) {
                    const birthDate = new Date(birthDateStr);
                    const now = new Date();
                    const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
                    return Math.max(0, months);
                  }
                  return 0;
                })()}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Mois</span>
            </div>
            <div className="h-8 w-px bg-stone-100"></div>
             <div className="text-center">
              <span className="block text-lg font-bold text-stone-800" data-testid="stat-complet">
                {Math.min(100, Math.round(((memories.length + bookPages.length) / 50) * 100))}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Complet</span>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'order' ? (
            // Order/Commander options - Plans with benefits
            <div className="p-4 space-y-4 pb-24">
              {/* Page Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-stone-800 font-fraunces">
                  {language === "fr" ? "Commander mon livre" : "Order my book"}
                </h1>
                <p className="text-sm text-stone-500 mt-1">
                  {language === "fr" ? "Choisissez votre formule et imprimez vos souvenirs" : "Choose your plan and print your memories"}
                </p>
              </div>
              
              {/* Trial Banner */}
              {isTrialActive && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-4 text-white shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Gift size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">Essai Premium GRATUIT</h4>
                      <p className="text-xs text-white/90">Il vous reste {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} d'essai Premium</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{trialDaysLeft}</div>
                      <div className="text-[10px] text-white/80">jours</div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Video Storage Warning */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 font-medium">Important concernant les vidéos</p>
                    <p className="text-[10px] text-amber-700 mt-1">
                      Les vidéos consomment beaucoup d'espace. Si vous téléversez des vidéos pendant l'essai Premium et choisissez ensuite l'option De base (1 Go), votre espace sera rapidement épuisé.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Nos forfaits</h3>
                <p className="text-xs text-stone-500">Choisissez le forfait qui vous convient</p>
              </div>
              
              {/* Plans Grid - Side by Side */}
              <div className="grid grid-cols-3 gap-2">
                {/* Base Plan - Free */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${userPlan === 'base' ? 'border-primary' : 'border-stone-100'}`}
                >
                  <div className="p-3">
                    <div className="text-center mb-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BookOpen size={16} className="text-stone-600" />
                      </div>
                      <h4 className="font-bold text-stone-800 text-xs">De base</h4>
                      <span className="text-sm font-bold text-primary">Gratuit</span>
                      {userPlan === 'base' && (
                        <span className="block text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1 mx-auto w-fit">Actuel</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start gap-1 text-[10px] text-stone-600">
                        <CheckCircle size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>1 Go photos</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-600">
                        <CheckCircle size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>Notifications</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-600">
                        <CheckCircle size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>Impression</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={userPlan === 'base' ? 'outline' : 'default'}
                      className="w-full h-7 text-[10px]"
                      data-testid="button-select-base"
                    >
                      {userPlan === 'base' ? 'Actuel' : 'Choisir'}
                    </Button>
                  </div>
                </motion.div>

                {/* Premium Plan */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${userPlan === 'premium' ? 'border-blue-400' : 'border-stone-100'}`}
                >
                  <div className="p-3">
                    <div className="text-center mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Crown size={16} className="text-blue-600" />
                      </div>
                      <h4 className="font-bold text-stone-800 text-xs">Premium</h4>
                      <span className="text-sm font-bold text-blue-600">1,99$</span>
                      <span className="text-[9px] text-stone-500 block">/mois</span>
                      {userPlan === 'premium' && (
                        <span className="block text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 mx-auto w-fit">Actuel</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start gap-1 text-[10px] text-stone-600">
                        <CheckCircle size={12} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>2 Go stockage</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-600 font-medium">
                        <CheckCircle size={12} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>Vidéos + photos</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-500">
                        <CheckCircle size={12} className="text-stone-400 flex-shrink-0 mt-0.5" />
                        <span>+ base</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={userPlan === 'premium' ? 'outline' : 'default'}
                      className={`w-full h-7 text-[10px] ${userPlan !== 'premium' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      data-testid="button-select-premium"
                      onClick={() => {
                        if (userPlan !== 'premium') {
                          setSelectedProduct({ name: "Abonnement Premium", price: "1,99$" });
                          setShowCheckout(true);
                        }
                      }}
                    >
                      {userPlan === 'premium' ? 'Actuel' : 'Choisir'}
                    </Button>
                  </div>
                </motion.div>

                {/* Platine Plan */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`relative bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${userPlan === 'platine' ? 'border-amber-400' : 'border-amber-200'}`}
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                    TOP
                  </div>
                  <div className="p-3">
                    <div className="text-center mb-3">
                      <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Crown size={16} className="text-amber-700" />
                      </div>
                      <h4 className="font-bold text-stone-800 text-xs">Platine</h4>
                      <span className="text-sm font-bold text-amber-700">4,99$</span>
                      <span className="text-[9px] text-stone-500 block">/mois</span>
                      {userPlan === 'platine' && (
                        <span className="block text-[9px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium mt-1 mx-auto w-fit">Actuel</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-start gap-1 text-[10px] text-stone-600 font-medium">
                        <CheckCircle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>5 Go stockage</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-500">
                        <CheckCircle size={12} className="text-stone-400 flex-shrink-0 mt-0.5" />
                        <span>+ Premium</span>
                      </div>
                      <div className="flex items-start gap-1 text-[10px] text-stone-500">
                        <CheckCircle size={12} className="text-stone-400 flex-shrink-0 mt-0.5" />
                        <span>+ base</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={userPlan === 'platine' ? 'outline' : 'default'}
                      className={`w-full h-7 text-[10px] ${userPlan !== 'platine' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                      data-testid="button-select-platine"
                      onClick={() => {
                        if (userPlan !== 'platine') {
                          if (userPlan === 'premium') {
                            handleCalculateUpgrade('premium', 'platine');
                          } else {
                            setSelectedProduct({ name: "Abonnement Platine", price: "4,99$" });
                            setShowCheckout(true);
                          }
                        }
                      }}
                      disabled={isCalculatingUpgrade}
                    >
                      {isCalculatingUpgrade ? <Loader2 className="w-3 h-3 animate-spin" /> : (userPlan === 'platine' ? 'Actuel' : (userPlan === 'premium' ? 'Passer à Platine' : 'Choisir'))}
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Price Chart for Books */}
              <div className="mt-6 pt-4 border-t border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 mb-3">Charte de prix - Impression</h3>
                <p className="text-xs text-stone-500 mb-4">Prix pour un livre de 50 pages</p>
                
                <div className="space-y-3">
                  {/* Softcover */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleSelectProduct("softcover")}
                    className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gradient-to-b from-secondary/20 to-stone-100 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-sm">Couverture souple</h4>
                        <p className="text-[10px] text-stone-500">Reliure légère et pratique</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-stone-800">43,24 $</span>
                      <p className="text-[10px] text-stone-400">+ 0,98$/page supp.</p>
                    </div>
                  </motion.div>

                  {/* Hardcover */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => handleSelectProduct("hardcover")}
                    className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gradient-to-b from-primary/20 to-stone-100 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-sm">Couverture rigide</h4>
                        <p className="text-[10px] text-stone-500">Qualité premium durable</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-stone-800">54,99 $</span>
                      <p className="text-[10px] text-stone-400">+ 0,98$/page supp.</p>
                    </div>
                  </motion.div>

                  {/* E-Book */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => handleSelectProduct("ebook")}
                    className="bg-white rounded-xl border border-stone-200 p-3 flex items-center justify-between cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gradient-to-b from-blue-100 to-stone-100 rounded-lg flex items-center justify-center">
                        <QrCode size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-800 text-sm">E-Book</h4>
                        <p className="text-[10px] text-stone-500">Version numérique + QR codes vidéos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-stone-800">30,00 $</span>
                      <p className="text-[10px] text-stone-400">+ 0,50$/page supp.</p>
                    </div>
                  </motion.div>
                </div>

                {/* Note */}
                <div className="bg-stone-50 rounded-xl p-3 mt-4">
                  <p className="text-[11px] text-stone-500 text-center">
                    Cliquez sur une option pour procéder au paiement
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'inspiration' ? (
            // Inspiration tab
            <div className="p-4 space-y-4 pb-24">
              {selectedInspiration === "Annonce de grossesse" ? (
                // Sub-pages for "Annonce de grossesse"
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => setSelectedInspiration(null)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                      data-testid="button-back-inspiration"
                    >
                      <ChevronLeft size={20} className="text-stone-600" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-stone-800">Annonce de grossesse</h3>
                      <p className="text-xs text-stone-500">Choisissez une page à ajouter</p>
                    </div>
                  </div>
                  
                  {[
                    { id: 1, title: "Réaction de tes grands-parents", icon: "👴👵", color: "from-amber-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
                    { id: 2, title: "Réaction de ton parrain", icon: "👨", color: "from-blue-100", desc: "Comment a-t-il réagi, qui lui a annoncé et de quelle façon" },
                    { id: 3, title: "Réaction de ta marraine", icon: "👩", color: "from-pink-100", desc: "Comment a-t-elle réagi, qui lui a annoncé et de quelle façon" },
                    { id: 4, title: "Réaction de tes oncles/tantes", icon: "👨‍👩‍👦", color: "from-teal-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
                    { id: 5, title: "Réaction de tes cousin(e)s", icon: "👧👦", color: "from-green-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
                    { id: 6, title: "Réaction de tes amis poilus", icon: "🐾", color: "from-orange-100", desc: "Comment ont-ils réagi, qui leur a annoncé et de quelle façon" },
                  ].map((subPage, idx) => (
                    <motion.div 
                      key={subPage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`inspiration-subpage-${subPage.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-b ${subPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{subPage.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 text-sm">{subPage.title}</h4>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs" 
                            data-testid={`button-add-subpage-${subPage.id}`}
                            onClick={() => handleAddInspirationPage(subPage)}
                          >
                            <Plus size={14} className="mr-1" /> Ajouter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : selectedInspiration === "Échographie" ? (
                // Sub-pages for "Échographie"
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => setSelectedInspiration(null)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                      data-testid="button-back-echographie"
                    >
                      <ChevronLeft size={20} className="text-stone-600" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-stone-800">Échographie</h3>
                      <p className="text-xs text-stone-500">Choisissez une page à ajouter</p>
                    </div>
                  </div>
                  
                  {[
                    { id: 1, title: "Ta première échographie", icon: "🔊", color: "from-purple-100" },
                    { id: 2, title: "Ta deuxième échographie", icon: "🔊", color: "from-indigo-100" },
                    { id: 3, title: "Ta troisième échographie", icon: "🔊", color: "from-blue-100" },
                    { id: 4, title: "Les échographies de suivi", icon: "📋", color: "from-teal-100" },
                    { id: 5, title: "La première fois que j'ai entendu ton coeur", icon: "💓", color: "from-pink-100" },
                  ].map((subPage, idx) => (
                    <motion.div 
                      key={subPage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`echographie-subpage-${subPage.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-b ${subPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{subPage.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 text-sm">{subPage.title}</h4>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs" 
                            data-testid={`button-add-echo-${subPage.id}`}
                            onClick={() => handleAddInspirationPage(subPage)}
                          >
                            <Plus size={14} className="mr-1" /> Ajouter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : selectedInspiration === "Événements lors de la grossesse" ? (
                // Sub-pages for "Événements lors de la grossesse"
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => setSelectedInspiration(null)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                      data-testid="button-back-evenements"
                    >
                      <ChevronLeft size={20} className="text-stone-600" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-stone-800">Événements lors de la grossesse</h3>
                      <p className="text-xs text-stone-500">Choisissez une page à ajouter</p>
                    </div>
                  </div>
                  
                  {[
                    { id: 1, title: "L'annonce du parrain", icon: "🤵", color: "from-indigo-100" },
                    { id: 2, title: "L'annonce de la marraine", icon: "👸", color: "from-rose-100" },
                    { id: 3, title: "Le dévoilement de sexe", icon: "🎀", color: "from-pink-100" },
                    { id: 4, title: "L'apprentissage du sexe", icon: "💭", color: "from-blue-100" },
                    { id: 5, title: "Le baby shower", icon: "🎉", color: "from-yellow-100" },
                    { id: 6, title: "Le baby moon", icon: "🌙", color: "from-purple-100" },
                  ].map((subPage, idx) => (
                    <motion.div 
                      key={subPage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`evenements-subpage-${subPage.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-b ${subPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{subPage.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 text-sm">{subPage.title}</h4>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs" 
                            data-testid={`button-add-event-${subPage.id}`}
                            onClick={() => handleAddInspirationPage(subPage)}
                          >
                            <Plus size={14} className="mr-1" /> Ajouter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : selectedInspiration === "Présentation de la famille" ? (
                // Sub-pages for "Présentation de la famille"
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button 
                      onClick={() => setSelectedInspiration(null)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                      data-testid="button-back-famille"
                    >
                      <ChevronLeft size={20} className="text-stone-600" />
                    </button>
                    <div>
                      <h3 className="text-sm font-bold text-stone-800">Présentation de la famille</h3>
                      <p className="text-xs text-stone-500">Choisissez une page à ajouter</p>
                    </div>
                  </div>
                  
                  {[
                    { id: 1, title: "Tes grands-parents", icon: "👴👵", color: "from-amber-100", desc: "Leur lien, date de naissance, hobbies, ce qu'ils aiment" },
                    { id: 2, title: "Tes oncles et tantes", icon: "👨‍👩‍👦", color: "from-blue-100", desc: "Nom, lien avec les parents, date de naissance, hobbies, travail" },
                    { id: 3, title: "Tes cousin(e)s", icon: "👧👦", color: "from-green-100", desc: "Noms, liens (enfants de qui?), date de naissance" },
                    { id: 4, title: "Tes amis poilus", icon: "🐾", color: "from-orange-100", desc: "Description, date de naissance, depuis quand dans la famille" },
                    { id: 5, title: "Les amis de la famille", icon: "🤝", color: "from-purple-100", desc: "Lien avec les parents, pourquoi importants, depuis quand" },
                  ].map((subPage, idx) => (
                    <motion.div 
                      key={subPage.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`famille-subpage-${subPage.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-b ${subPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{subPage.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 text-sm">{subPage.title}</h4>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs" 
                            data-testid={`button-add-famille-${subPage.id}`}
                            onClick={() => handleAddInspirationPage(subPage)}
                          >
                            <Plus size={14} className="mr-1" /> Ajouter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                // Main inspiration list
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-stone-800 mb-1">Pages d'inspiration</h3>
                    <p className="text-xs text-stone-500">Ajoutez ces pages spéciales à votre livre</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par mot-clé..."
                      value={inspirationSearch}
                      onChange={(e) => setInspirationSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      data-testid="input-inspiration-search"
                    />
                  </div>
                  
                  {[
                    { 
                      title: "Présentation de la famille", 
                      desc: "Grands-parents, oncles, tantes, cousins, amis", 
                      icon: "👨‍👩‍👧‍👦", 
                      color: "from-teal-100", 
                      keywords: ["famille", "présentation", "parents", "proches", "grands-parents", "oncles", "tantes", "cousins", "amis poilus", "animaux"], 
                      hasSubPages: true,
                      subPages: ["Tes grands-parents", "Tes oncles et tantes", "Tes cousin(e)s", "Tes amis poilus", "Les amis de la famille"]
                    },
                    { 
                      title: "Annonce de grossesse", 
                      desc: "Réactions de la famille et des proches", 
                      icon: "🤰", 
                      color: "from-pink-100", 
                      keywords: ["annonce", "grossesse", "nouvelle", "enceinte", "réaction"], 
                      hasSubPages: true,
                      subPages: ["Réaction de tes grands-parents", "Réaction de ton parrain", "Réaction de ta marraine", "Réaction de tes oncles/tantes", "Réaction de tes cousin(e)s", "Réaction de tes amis poilus"]
                    },
                    { 
                      title: "Échographie", 
                      desc: "Les premiers aperçus", 
                      icon: "🔊", 
                      color: "from-purple-100", 
                      keywords: ["échographie", "scan", "médical", "bébé"], 
                      hasSubPages: true,
                      subPages: ["Ta première échographie", "Ta deuxième échographie", "Ta troisième échographie", "Les échographies de suivi", "La première fois que j'ai entendu ton coeur", "coeur", "battement", "suivi"]
                    },
                    { 
                      title: "Adoption", 
                      desc: "Notre parcours d'adoption", 
                      icon: "💕", 
                      color: "from-blue-100", 
                      keywords: ["adoption", "famille", "parcours", "accueil"], 
                      hasSubPages: false,
                      subPages: []
                    },
                    { 
                      title: "FIV", 
                      desc: "Notre parcours de fertilité", 
                      icon: "🌱", 
                      color: "from-orange-100", 
                      keywords: ["fiv", "fertilité", "parcours", "ivf", "procréation"], 
                      hasSubPages: false,
                      subPages: []
                    },
                    { 
                      title: "Événements lors de la grossesse", 
                      desc: "Célébrez avec vos proches", 
                      icon: "🎉", 
                      color: "from-yellow-100", 
                      keywords: ["baby shower", "fête", "célébration", "cadeau", "événement", "grossesse"], 
                      hasSubPages: true,
                      subPages: ["L'annonce du parrain", "L'annonce de la marraine", "Le dévoilement de sexe", "gender reveal", "L'apprentissage du sexe", "Le baby shower", "Le baby moon", "parrain", "marraine", "sexe", "shower", "moon"]
                    },
                    { 
                      title: "Chambre de bébé", 
                      desc: "Le nid douillet", 
                      icon: "🛏️", 
                      color: "from-green-100", 
                      keywords: ["chambre", "décoration", "nursery", "lit"], 
                      hasSubPages: false,
                      subPages: []
                    },
                    { 
                      title: "Lettre à bébé", 
                      desc: "Vos mots d'amour", 
                      icon: "💌", 
                      color: "from-red-100", 
                      keywords: ["lettre", "message", "amour", "souvenir"], 
                      hasSubPages: false,
                      subPages: []
                    },
                    { 
                      title: "Premier mot", 
                      desc: "Maman ou Papa?", 
                      icon: "💬", 
                      color: "from-indigo-100", 
                      keywords: ["mot", "parler", "langage", "maman", "papa"], 
                      hasSubPages: false,
                      subPages: []
                    },
                    { 
                      title: "Première dent", 
                      desc: "Un sourire tout neuf", 
                      icon: "🦷", 
                      color: "from-cyan-100", 
                      keywords: ["dent", "sourire", "bébé"], 
                      hasSubPages: false,
                      subPages: []
                    },
                  ].filter(item => {
                    if (!inspirationSearch.trim()) return true;
                    const searchLower = inspirationSearch.toLowerCase();
                    return item.title.toLowerCase().includes(searchLower) || 
                           item.desc.toLowerCase().includes(searchLower) ||
                           item.keywords.some(k => k.toLowerCase().includes(searchLower)) ||
                           item.subPages.some(sp => sp.toLowerCase().includes(searchLower));
                  }).map((item, idx) => (
                    <motion.div 
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => item.hasSubPages && setSelectedInspiration(item.title)}
                      data-testid={`inspiration-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-b ${item.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                            <span className="text-xl">{item.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-stone-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-stone-500">{item.desc}</p>
                          </div>
                          {item.hasSubPages ? (
                            <ChevronRight size={20} className="text-stone-400" />
                          ) : (
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                              <Plus size={14} className="mr-1" /> Ajouter
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          ) : activeTab === 'account' ? (
            // Account tab
            <div className="p-4 space-y-4 pb-24 overflow-y-auto">
              {/* Trial Banner in Account */}
              {isTrialActive && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <Gift size={18} className="text-white" />
                    <div className="flex-1">
                      <p className="text-xs font-bold">Essai Premium - {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}</p>
                    </div>
                    <Clock size={16} className="text-white/80" />
                  </div>
                </motion.div>
              )}
              
              {/* Profile Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User size={28} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-800">{userInfo.name}</h3>
                    <p className="text-xs text-stone-500">{userInfo.email}</p>
                  </div>
                  <Link href="/app/profile">
                    <button className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-edit-profile">
                      <Edit2 size={16} className="text-stone-500" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Baby Info Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Baby size={18} className="text-primary" />
                    <h4 className="font-bold text-stone-800 text-sm">Informations du bébé</h4>
                  </div>
                  {!isEditingBabyInfo && (
                    <button 
                      onClick={startEditingBabyInfo}
                      className="p-2 hover:bg-stone-100 rounded-full"
                      data-testid="button-edit-baby-info"
                    >
                      <Edit2 size={16} className="text-stone-500" />
                    </button>
                  )}
                </div>
                
                {isEditingBabyInfo ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Prénom du bébé</label>
                      <input
                        type="text"
                        value={editBabyName}
                        onChange={(e) => setEditBabyName(e.target.value)}
                        className="w-full p-2 border border-stone-200 rounded-lg text-sm"
                        placeholder="Prénom"
                        data-testid="input-baby-name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">Sexe</label>
                      <select
                        value={editBabyGender}
                        onChange={(e) => setEditBabyGender(e.target.value as "garcon" | "fille" | "neutre")}
                        className="w-full p-2 border border-stone-200 rounded-lg text-sm"
                        data-testid="select-baby-gender"
                      >
                        <option value="garcon">Garçon</option>
                        <option value="fille">Fille</option>
                        <option value="neutre">Non spécifié</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 block mb-1">
                        {activeBook?.babyStatus === "enceinte" ? "Date prévue d'accouchement" : "Date de naissance"}
                      </label>
                      <input
                        type="date"
                        value={editBabyDate}
                        onChange={(e) => setEditBabyDate(e.target.value)}
                        className="w-full p-2 border border-stone-200 rounded-lg text-sm"
                        data-testid="input-baby-date"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingBabyInfo(false)}
                        className="flex-1 h-9"
                        data-testid="button-cancel-baby-info"
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveBabyInfo}
                        disabled={isSavingBabyInfo || !editBabyName.trim()}
                        className="flex-1 h-9"
                        data-testid="button-save-baby-info"
                      >
                        {isSavingBabyInfo ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Check size={14} className="mr-1" />
                        )}
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Prénom</span>
                      <span className="text-sm font-medium text-stone-800">{activeBook?.childName || "Non défini"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-xs text-stone-500">Sexe</span>
                      <span className="text-sm font-medium text-stone-800">
                        {activeBook?.babyGender === "garcon" ? "Garçon" : 
                         activeBook?.babyGender === "fille" ? "Fille" : "Non spécifié"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-stone-500">
                        {activeBook?.babyStatus === "enceinte" ? "Date prévue" : "Date de naissance"}
                      </span>
                      <span className="text-sm font-medium text-stone-800">
                        {activeBook?.birthDate 
                          ? new Date(activeBook.birthDate).toLocaleDateString("fr-CA", { 
                              day: "numeric", 
                              month: "long", 
                              year: "numeric" 
                            })
                          : "Non définie"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={18} className="text-primary" />
                  <h4 className="font-bold text-stone-800 text-sm">Notifications</h4>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 mb-3">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {activeBook?.babyStatus === "enceinte" ? (
                      <>Nous vous enverrons des suggestions personnalisées comme <span className="font-medium">"C'est le moment de prendre une photo de votre ventre!"</span> ou <span className="font-medium">"{ageNotification.title}"</span></>
                    ) : (
                      <>Nous vous enverrons des suggestions personnalisées comme <span className="font-medium">"C'est le moment de capturer le premier sourire!"</span> ou <span className="font-medium">"{ageNotification.title}"</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-700">Notifications push</p>
                    <p className="text-[10px] text-stone-500">Recevez des rappels importants</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-7 text-[10px]"
                    onClick={handleEnableNotifications}
                    data-testid="button-enable-push"
                  >
                    <Bell size={12} className="mr-1" />
                    Activer
                  </Button>
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={18} className="text-amber-500" />
                  <h4 className="font-bold text-stone-800 text-sm">Mon abonnement</h4>
                </div>
                
                {/* Current Plan Status */}
                <div className={`p-3 rounded-xl mb-3 ${
                  userPlan === "platine" ? "bg-amber-50 border border-amber-200" :
                  userPlan === "premium" ? "bg-blue-50 border border-blue-200" :
                  "bg-stone-50 border border-stone-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-stone-500">Plan actuel</p>
                      <p className={`font-bold text-sm ${
                        userPlan === "platine" ? "text-amber-700" :
                        userPlan === "premium" ? "text-blue-700" :
                        "text-stone-700"
                      }`}>
                        {userPlan === "platine" ? "Platine" : userPlan === "premium" ? "Premium" : "De base"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500">Tarif</p>
                      <p className="font-bold text-sm text-stone-800">
                        {userPlan === "platine" ? "4,99$/mois" : userPlan === "premium" ? "1,99$/mois" : "Gratuit"}
                      </p>
                    </div>
                  </div>
                  {userPlan !== "base" && (
                    <p className="text-[10px] text-stone-500 mt-2">
                      Prochain renouvellement: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "base", label: "De base", price: "Gratuit", color: "stone" },
                    { id: "premium", label: "Premium", price: "1,99$/mois", color: "blue" },
                    { id: "platine", label: "Platine", price: "4,99$/mois", color: "amber" },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        if (plan.id === "base") {
                          if (userPlan !== "base") {
                            setShowCancelSubscription(true);
                          }
                        } else if (plan.id !== userPlan) {
                          setSelectedProduct({ name: `Abonnement ${plan.label}`, price: plan.price.replace("/mois", "") });
                          setShowCheckout(true);
                        }
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        userPlan === plan.id
                          ? plan.id === "platine" 
                            ? "border-amber-400 bg-amber-50"
                            : plan.id === "premium"
                            ? "border-blue-400 bg-blue-50"
                            : "border-primary bg-primary/5"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                      data-testid={`button-plan-${plan.id}`}
                    >
                      <p className={`font-bold text-xs ${userPlan === plan.id ? (plan.id === "platine" ? "text-amber-700" : plan.id === "premium" ? "text-blue-700" : "text-primary") : "text-stone-700"}`}>
                        {plan.label}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1">{plan.price}</p>
                    </button>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="mt-3 space-y-2">
                  {userPlan !== "platine" && (
                    <Button 
                      size="sm" 
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const nextPlan = userPlan === "base" ? { name: "Abonnement Premium", price: "1,99$" } : { name: "Abonnement Platine", price: "4,99$" };
                        setSelectedProduct(nextPlan);
                        setShowCheckout(true);
                      }}
                      data-testid="button-upgrade-plan"
                    >
                      <Crown size={12} className="mr-1" />
                      Passer à {userPlan === "base" ? "Premium" : "Platine"}
                    </Button>
                  )}
                  
                  {userPlan !== "base" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setShowManageSubscription(true)}
                        data-testid="button-manage-subscription"
                      >
                        <Settings size={12} className="mr-1" />
                        Gérer
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => setShowCancelSubscription(true)}
                        data-testid="button-cancel-subscription"
                      >
                        <X size={12} className="mr-1" />
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Style */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-primary" />
                  <h4 className="font-bold text-stone-800 text-sm">Style du livre</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "moderne", label: "Moderne", icon: "✨", desc: "Épuré et minimaliste", preview: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop" },
                    { id: "classique", label: "Classique", icon: "📖", desc: "Traditionnel et élégant", preview: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=300&fit=crop" },
                    { id: "colore", label: "Coloré", icon: "🎨", desc: "Vif et joyeux", preview: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop" },
                    { id: "animation", label: "Animation", icon: "🎬", desc: "Ludique et animé", preview: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop" },
                  ].map((style) => (
                    <div key={style.id} className="relative">
                      <button
                        onClick={() => {
                          setBookStyle(style.id as any);
                          setPreviewStyle(previewStyle === style.id ? null : style.id);
                        }}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                          bookStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                        data-testid={`button-style-${style.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{style.icon}</span>
                          <p className={`font-bold text-xs ${bookStyle === style.id ? "text-primary" : "text-stone-700"}`}>
                            {style.label}
                          </p>
                        </div>
                        <p className="text-[10px] text-stone-500">{style.desc}</p>
                      </button>
                      
                      {/* Preview Bubble */}
                      <AnimatePresence>
                        {previewStyle === style.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2"
                          >
                            <div className="bg-white rounded-xl shadow-xl border border-stone-200 p-2 w-48">
                              <img 
                                src={style.preview} 
                                alt={`Aperçu ${style.label}`}
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                              <p className="text-xs font-medium text-stone-800 text-center">{style.label}</p>
                              <p className="text-[10px] text-stone-500 text-center">{style.desc}</p>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-stone-800 text-sm">Informations personnelles</h4>
                  <Link href="/app/profile">
                    <button className="text-xs text-primary font-medium" data-testid="button-modify-info">Modifier</button>
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-stone-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-400 uppercase">Nom</p>
                      <p className="text-sm text-stone-800">{userInfo.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-stone-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-400 uppercase">Courriel</p>
                      <p className="text-sm text-stone-800">{userInfo.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-stone-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-400 uppercase">Téléphone</p>
                      <p className="text-sm text-stone-800">{userInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-stone-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-400 uppercase">Adresse</p>
                      <p className="text-sm text-stone-800">{userInfo.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-stone-400" />
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-400 uppercase">Sexe</p>
                      <p className="text-sm text-stone-800">{userInfo.gender}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invited Users */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-stone-600" />
                    <h4 className="font-bold text-stone-800 text-sm">Utilisateurs invités</h4>
                  </div>
                  <button 
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="text-xs text-primary font-medium flex items-center gap-1"
                  >
                    <UserPlus size={14} /> Ajouter
                  </button>
                </div>

                {showAddUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-3 p-3 bg-stone-50 rounded-xl space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Nom"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                      data-testid="input-new-user-name"
                    />
                    <input
                      type="email"
                      placeholder="Courriel"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                      data-testid="input-new-user-email"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setShowAddUser(false)}>
                        Annuler
                      </Button>
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={addInvitedUser} data-testid="button-confirm-add-user">
                        Ajouter
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {invitedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-800">{user.name}</p>
                        <p className="text-xs text-stone-500">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => removeInvitedUser(user.id)}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {invitedUsers.length === 0 && (
                    <p className="text-sm text-stone-400 text-center py-4">Aucun utilisateur invité</p>
                  )}
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <h4 className="font-bold text-stone-800 text-sm mb-3">Aide</h4>
                <button 
                  className="w-full p-3 bg-primary/5 rounded-xl flex items-center gap-3 hover:bg-primary/10 transition-colors mb-2"
                  onClick={restartTutorial}
                  data-testid="button-restart-tutorial"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-800">Revoir le tutoriel</p>
                    <p className="text-xs text-stone-500">Apprenez à utiliser l'application</p>
                  </div>
                  <ChevronRight size={16} className="text-stone-400" />
                </button>
              </div>

              {/* Logout Button */}
              <button 
                className="w-full p-4 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors text-red-600"
                onClick={() => setLocation("/")}
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          ) : (
            // Mes créations - Dashboard View
            <div className="flex-1 flex flex-col pb-20 overflow-y-auto">
              {/* Active Book Preview - Featured at Top */}
              {activeBook && (
                <div className="px-4 pt-4 pb-2">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 rounded-3xl p-5 border border-primary/20 shadow-lg"
                    data-testid="active-book-preview"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">Livre actif</span>
                    </div>
                    
                    <div className="flex gap-4">
                      {/* Book Cover Preview */}
                      <div className="relative">
                        <div className="w-24 h-32 rounded-xl overflow-hidden shadow-xl border-2 border-white">
                          <img 
                            src={activeBook.coverImage || "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop"} 
                            className="w-full h-full object-cover" 
                            alt={activeBook.childName}
                          />
                        </div>
                        {/* Mini pages stack effect */}
                        <div className="absolute -right-2 top-2 w-20 h-28 bg-white/80 rounded-lg shadow-md -z-10 rotate-3"></div>
                        <div className="absolute -right-3 top-3 w-18 h-26 bg-white/60 rounded-lg shadow-sm -z-20 rotate-6"></div>
                      </div>
                      
                      {/* Book Info */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="text-lg font-bold text-stone-900 mb-1">L'histoire de {activeBook.childName}</h3>
                          <p className="text-xs text-stone-500 mb-2">
                            {activeBook.birthDate 
                              ? new Date(activeBook.birthDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) 
                              : 'Date à définir'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-stone-600">
                            <span className="flex items-center gap-1">
                              <BookOpen size={12} />
                              {isPrebuiltBook && prebuiltPagesData?.templatePages 
                                ? prebuiltPagesData.templatePages.length 
                                : bookPages.length} pages
                            </span>
                            <span className="flex items-center gap-1">
                              <ImageIcon size={12} />
                              {isPrebuiltBook && prebuiltPagesData?.pages 
                                ? prebuiltPagesData.pages.filter(p => {
                                    const photos = (p.photos as string[] | null) || [];
                                    return photos.length > 0;
                                  }).length 
                                : bookPages.filter(p => p.type === 'photo').length} photos
                            </span>
                          </div>
                        </div>
                        
                        <Link href={'templateSlug' in activeBook && activeBook.templateSlug && activeBook.templateSlug !== 'custom' 
                          ? `/app/book/${activeBook.id}/prebuilt` 
                          : `/app/book/${activeBook.id}/edit`}>
                          <Button size="sm" className="w-full mt-3 gap-2" data-testid="button-edit-active-book">
                            <Edit2 size={14} />
                            Continuer l'édition
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Page Thumbnails */}
                    <div className="mt-4 pt-3 border-t border-stone-200/50">
                      <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-2">Aperçu des pages</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {isPrebuiltBook && prebuiltPagesData?.templatePages ? (
                          <>
                            {prebuiltPagesData.templatePages.slice(0, 5).map((templatePage) => {
                              const userPage = prebuiltPagesData.pages.find(p => p.pageNumber === templatePage.pageNumber);
                              return (
                                <PageThumbnail
                                  key={templatePage.id}
                                  templatePage={templatePage}
                                  userPage={userPage}
                                  language="fr"
                                  size="sm"
                                  onClick={() => setLocation(`/app/book/${activeBook.id}/prebuilt`)}
                                />
                              );
                            })}
                            {prebuiltPagesData.templatePages.length > 5 && (
                              <div className="w-12 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 border border-stone-200">
                                <span className="text-xs text-stone-500">+{prebuiltPagesData.templatePages.length - 5}</span>
                              </div>
                            )}
                          </>
                        ) : prebuiltPagesLoading && isPrebuiltBook ? (
                          <>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <PageThumbnailSkeleton key={i} size="sm" />
                            ))}
                          </>
                        ) : (
                          <>
                            {bookPages.slice(0, 5).map((page, idx) => (
                              <div 
                                key={page.id} 
                                className="w-12 h-16 rounded-lg overflow-hidden shadow-sm border border-stone-200 flex-shrink-0 bg-white"
                              >
                                {page.image ? (
                                  <img src={page.image} className="w-full h-full object-cover" alt={page.title} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                                    <span className="text-[8px] text-stone-400 text-center px-1">{page.title}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {bookPages.length > 5 && (
                              <div className="w-12 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0 border border-stone-200">
                                <span className="text-xs text-stone-500">+{bookPages.length - 5}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Quick Actions - Moved up */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">Actions rapides</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowPhotoModal(true)}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-stone-100 hover:shadow-md hover:border-primary/30 transition-all"
                    data-testid="quick-action-photo"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ImageIcon size={18} className="text-blue-600" />
                    </div>
                    <span className="text-[10px] font-medium text-stone-600">Photo</span>
                  </motion.button>
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-stone-100 hover:shadow-md hover:border-primary/30 transition-all"
                    data-testid="quick-action-video"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Video size={18} className="text-purple-600" />
                    </div>
                    <span className="text-[10px] font-medium text-stone-600">Vidéo</span>
                  </motion.button>
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-stone-100 hover:shadow-md hover:border-primary/30 transition-all"
                    data-testid="quick-action-milestone"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-medium text-stone-600">Étape</span>
                  </motion.button>
                </div>
              </div>

              {/* Book Preview Section - Moved up */}
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">Aperçu du livre</h4>
                  <span className="text-[10px] text-stone-400">
                    Page {currentPage + 1}/{isPrebuiltBook && prebuiltPagesData?.templatePages ? prebuiltPagesData.templatePages.length : bookPages.length}
                  </span>
                </div>

                <div className="relative mb-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden h-full min-h-[300px]"
                    >
                      {isPrebuiltBook && prebuiltPagesData?.templatePages ? (
                        (() => {
                          const templatePage = prebuiltPagesData.templatePages[currentPage];
                          const userPage = prebuiltPagesData.pages.find(p => p.pageNumber === templatePage?.pageNumber);
                          const photos = (userPage?.photos as string[] | null) || [];
                          const textContent = (userPage?.textContent as string[] | null) || [];
                          const isCompleted = userPage?.isCompleted || false;
                          const hasContent = photos.length > 0 || textContent.length > 0;
                          
                          if (!templatePage) return null;
                          
                          return (
                            <div className="h-full flex flex-col min-h-[300px]">
                              {photos.length > 0 ? (
                                <div className="flex-1 relative">
                                  <img 
                                    src={photos[0]} 
                                    className="w-full h-full object-cover" 
                                    alt={templatePage.titleFr}
                                  />
                                  {isCompleted && (
                                    <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                      <CheckCircle size={20} className="text-white" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex-1 p-6 bg-gradient-to-br from-primary/5 to-white flex flex-col items-center justify-center">
                                  {templatePage.pageType === "birth_info" ? (
                                    <Baby size={48} className="text-secondary mb-4" />
                                  ) : templatePage.pageType === "collage" ? (
                                    <ImageIcon size={48} className="text-primary mb-4" />
                                  ) : templatePage.pageType === "message" ? (
                                    <Bell size={48} className="text-amber-500 mb-4" />
                                  ) : templatePage.pageType.includes("milestone") || templatePage.pageType.includes("month") ? (
                                    <Calendar size={48} className="text-primary mb-4" />
                                  ) : (
                                    <ImageIcon size={48} className="text-stone-300 mb-4" />
                                  )}
                                  {isCompleted && (
                                    <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                      <CheckCircle size={20} className="text-white" />
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="p-4 bg-white border-t border-stone-100">
                                <h3 className="font-bold text-stone-800 text-lg">{templatePage.titleFr}</h3>
                                {templatePage.subtitleFr && (
                                  <p className="text-sm text-stone-500">{templatePage.subtitleFr}</p>
                                )}
                                {!hasContent && !isCompleted && (
                                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    À compléter
                                  </p>
                                )}
                                {hasContent && !isCompleted && (
                                  <p className="text-xs text-blue-600 mt-2">En cours...</p>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : bookPages[currentPage]?.type === "cover" ? (
                        <div className="h-full relative min-h-[300px]">
                          <img 
                            src={bookPages[currentPage].image} 
                            className="w-full h-full object-cover" 
                            alt="Couverture"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                            <h2 className="text-2xl font-serif font-bold text-white">L'histoire de {babyName}</h2>
                            <p className="text-white/80 text-sm">Famille Dupond-Martin</p>
                          </div>
                        </div>
                      ) : bookPages[currentPage]?.type === "birth" ? (
                        <div className="h-full p-6 bg-gradient-to-br from-secondary/10 to-white flex flex-col justify-center min-h-[300px]">
                          <div className="text-center mb-6">
                            <Baby size={48} className="text-secondary mx-auto mb-3" />
                            <h3 className="text-xl font-serif font-bold text-stone-800">{bookPages[currentPage].title}</h3>
                            <p className="text-sm text-stone-500">{bookPages[currentPage].date}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {bookPages[currentPage].stats && Object.entries(bookPages[currentPage].stats).map(([key, value]) => (
                              <div key={key} className="bg-white border border-stone-100 rounded-xl p-3 text-center shadow-sm">
                                <span className="block text-lg font-bold text-stone-800">{value as string}</span>
                                <span className="text-xs text-stone-400 uppercase">{key}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : bookPages[currentPage]?.type === "photo" ? (
                        <div className="h-full flex flex-col min-h-[300px]">
                          <div className="flex-1 relative">
                            <img 
                              src={bookPages[currentPage].image} 
                              className="w-full h-full object-cover" 
                              alt={bookPages[currentPage].title}
                            />
                          </div>
                          <div className="p-4 bg-white">
                            <h3 className="font-bold text-stone-800">{bookPages[currentPage].title}</h3>
                            <p className="text-sm text-stone-600">{bookPages[currentPage].desc}</p>
                          </div>
                        </div>
                      ) : bookPages[currentPage]?.type === "milestone" ? (
                        <div className="h-full p-6 bg-gradient-to-br from-primary/10 to-white flex flex-col justify-center text-center min-h-[300px]">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={32} className="text-primary" />
                          </div>
                          <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">{bookPages[currentPage].title}</h3>
                          <p className="text-sm text-stone-500 mb-4">{bookPages[currentPage].date}</p>
                          <p className="text-stone-600">{bookPages[currentPage].desc}</p>
                        </div>
                      ) : (
                        <div className="h-full p-6 flex flex-col items-center justify-center text-center bg-stone-50 min-h-[300px]">
                          <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-4">
                            <Plus size={32} className="text-stone-400" />
                          </div>
                          <h3 className="font-bold text-stone-600 mb-2">{bookPages[currentPage]?.title || "Page vide"}</h3>
                          <p className="text-sm text-stone-400">{bookPages[currentPage]?.desc || "Ajoutez du contenu"}</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <button 
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft size={20} className="text-stone-700" />
                  </button>
                  <button 
                    onClick={nextPage}
                    disabled={currentPage === (isPrebuiltBook && prebuiltPagesData?.templatePages ? prebuiltPagesData.templatePages.length - 1 : bookPages.length - 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    data-testid="button-next-page"
                  >
                    <ChevronRight size={20} className="text-stone-700" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1">
                  {(isPrebuiltBook && prebuiltPagesData?.templatePages ? prebuiltPagesData.templatePages : bookPages).slice(0, 10).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentPage === idx ? 'bg-primary' : 'bg-stone-300'}`}
                    />
                  ))}
                  {(isPrebuiltBook && prebuiltPagesData?.templatePages ? prebuiltPagesData.templatePages.length : bookPages.length) > 10 && (
                    <span className="text-[10px] text-stone-400 ml-1">...</span>
                  )}
                </div>
              </div>

              {/* Add Page Button - Separate section */}
              <div className="px-4 py-3">
                <button
                  onClick={addBasicPage}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                  data-testid="button-add-page"
                >
                  <Plus size={18} />
                  Ajouter une nouvelle page
                </button>
              </div>

              {/* Dashboard Header */}
              <div className="p-4 pb-2">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Tableau de bord</h3>
                <p className="text-xs text-stone-500">Accédez rapidement à vos créations</p>
              </div>

              {/* All Books Section - Full Cards */}
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">Mes livres en cours</h4>
                  <span className="text-xs text-stone-500">{userBooks.length} livre{userBooks.length > 1 ? 's' : ''}</span>
                </div>
                
                {booksLoading ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <Loader2 className="animate-spin text-primary" size={24} />
                  </div>
                ) : userBooks.length > 0 ? (
                  <div className="space-y-3">
                    {userBooks.map((book, idx) => {
                      const isActive = activeBook?.id === book.id;
                      const bookImage = book.coverImage || "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop";
                      const statusLabel = book.babyStatus === "enceinte" ? "Enceinte" : 
                                         book.babyStatus === "ne" ? "Né(e)" : 
                                         book.babyStatus === "adopte" ? "Adopté(e)" : "En cours";
                      const genderColor = book.babyGender === "fille" ? "from-pink-100 to-pink-50" :
                                         book.babyGender === "garcon" ? "from-blue-100 to-blue-50" : 
                                         "from-primary/10 to-secondary/10";
                      const genderBorder = book.babyGender === "fille" ? "border-pink-200" :
                                          book.babyGender === "garcon" ? "border-blue-200" : 
                                          "border-primary/20";
                      
                      return (
                        <motion.div 
                          key={book.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`bg-gradient-to-r ${genderColor} rounded-2xl p-4 border ${genderBorder} cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ring-primary shadow-md' : ''}`}
                          data-testid={`card-book-${book.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-20 rounded-lg overflow-hidden shadow-md relative">
                              <img 
                                src={bookImage} 
                                className="w-full h-full object-cover" 
                                alt={book.childName}
                              />
                              {isActive && (
                                <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                  <CheckCircle size={12} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen size={14} className="text-primary" />
                                <span className="text-[10px] text-primary font-medium uppercase tracking-wide">{statusLabel}</span>
                              </div>
                              <h4 className="font-bold text-stone-900 text-base">L'histoire de {book.childName}</h4>
                              <p className="text-xs text-stone-600">
                                {book.birthDate ? new Date(book.birthDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date à définir'}
                                {' • '}{bookPages.length} pages
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Link 
                                href={'templateSlug' in book && book.templateSlug && book.templateSlug !== 'custom' 
                                  ? `/app/book/${book.id}/prebuilt` 
                                  : `/app/book/${book.id}/edit`} 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setActiveBookMutation.mutate(book.id); 
                                }}
                              >
                                <Button size="sm" variant="outline" className="text-xs h-8 px-3" data-testid={`button-edit-book-${book.id}`}>
                                  <Edit2 size={12} className="mr-1" />
                                  Éditer
                                </Button>
                              </Link>
                              <div className="flex gap-1">
                                {!isActive && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-xs h-8 px-2 text-primary flex-1"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setActiveBookMutation.mutate(book.id); 
                                    }}
                                    data-testid={`button-select-book-${book.id}`}
                                  >
                                    Sélectionner
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleDeleteBook({ id: book.id, childName: book.childName, isLocal: (book as any).isLocal });
                                  }}
                                  data-testid={`button-delete-book-${book.id}`}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {/* Add new book button */}
                    <Link href="/onboarding">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: userBooks.length * 0.1 }}
                        className="bg-white rounded-2xl p-4 border-2 border-dashed border-stone-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3"
                        data-testid="dashboard-add-book"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                          <Plus size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">Créer un nouveau livre</p>
                          <p className="text-xs text-stone-500">Documenter une nouvelle histoire</p>
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Baby size={48} className="text-stone-300 mx-auto mb-3" />
                    <p className="text-sm text-stone-500 mb-4">Aucun livre créé</p>
                    <Link href="/onboarding">
                      <Button className="gap-2" data-testid="button-create-first-book">
                        <Plus size={16} />
                        Créer mon premier livre
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="h-16 bg-white border-t border-stone-100 flex items-center justify-around px-2 relative z-20">
          <button 
            className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'creations' ? 'text-primary' : 'text-stone-400'}`} 
            onClick={() => setActiveTab('creations')}
            data-testid="nav-creations"
          >
            <FolderHeart size={20} />
            <span className="text-[10px] font-medium">Mes créations</span>
          </button>
          <button 
            className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'inspiration' ? 'text-primary' : 'text-stone-400'}`} 
            onClick={() => setActiveTab('inspiration')}
            data-testid="nav-inspiration"
          >
            <Sparkles size={20} />
            <span className="text-[10px] font-medium">Inspiration</span>
          </button>
          <button 
            className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'order' ? 'text-primary' : 'text-stone-400'}`} 
            onClick={() => setActiveTab('order')}
            data-testid="nav-order"
          >
            <ShoppingBag size={20} />
            <span className="text-[10px] font-medium">Commander</span>
          </button>
          <button 
            className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'account' ? 'text-primary' : 'text-stone-400'}`} 
            onClick={() => setActiveTab('account')}
            data-testid="nav-account"
          >
            <User size={20} />
            <span className="text-[10px] font-medium">Compte</span>
          </button>
        </div>

        {/* Bottom safe area */}
        <div className="h-2 bg-white"></div>
      </div>
      
      {/* Desktop Context (Outside phone) */}
      <div className="hidden lg:block ml-16 max-w-sm space-y-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-500 text-xs font-medium shadow-sm">
           <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
           Mode Prototype
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-900">L'expérience d'édition</h2>
        <p className="text-stone-600 leading-relaxed">
            L'interface a été mise à jour selon le cahier des charges pour inclure les notifications intelligentes, les fiches de naissance et l'inclusivité.
        </p>
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
            <h4 className="font-bold text-stone-800 mb-2 text-sm">Nouveautés</h4>
            <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary"/> Notifications Intelligentes (Top)</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary"/> Carte de Naissance</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary"/> QR Codes Vidéo</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary"/> Profil Famille Inclusive</li>
            </ul>
        </div>
        <Link href="/">
            <Button variant="outline" className="w-full mt-4">Retour à l'accueil</Button>
        </Link>
      </div>

      {/* Notification Instructions Modal */}
      <AnimatePresence>
        {showNotificationInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowNotificationInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1">Activer dans les réglages</h3>
                <p className="text-sm text-white/90">
                  Les notifications doivent être activées dans les paramètres de votre appareil
                </p>
              </div>
              
              <div className="p-5 space-y-4">
                {/iPhone|iPad|iPod/.test(typeof navigator !== "undefined" ? navigator.userAgent : "") ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-stone-800">Sur iPhone/iPad :</p>
                    <ol className="space-y-2 text-xs text-stone-600">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                        Ouvrez l'app <span className="font-medium">Réglages</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                        Descendez et appuyez sur <span className="font-medium">Safari</span> (ou votre navigateur)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                        Appuyez sur <span className="font-medium">Notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</span>
                        Activez les notifications pour <span className="font-medium">Memoria</span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-stone-800">Sur Android :</p>
                    <ol className="space-y-2 text-xs text-stone-600">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                        Appuyez longuement sur l'icône du navigateur
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                        Sélectionnez <span className="font-medium">Infos sur l'appli</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                        Appuyez sur <span className="font-medium">Notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">4</span>
                        Activez les notifications pour ce site
                      </li>
                    </ol>
                  </div>
                )}
                
                <Button
                  className="w-full"
                  onClick={() => setShowNotificationInstructions(false)}
                  data-testid="button-close-instructions"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Configuration Modal */}
      <AnimatePresence>
        {showOrderConfigModal && selectedProductType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowOrderConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-stone-800">Configurer votre commande</h3>
                  <p className="text-xs text-stone-500">
                    {selectedProductType === "softcover" ? "Couverture souple" : 
                     selectedProductType === "hardcover" ? "Couverture rigide" : "E-Book"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowOrderConfigModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Quantity Selector */}
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-3 block">Nombre de copies</label>
                  <div className="flex items-center justify-center gap-4 bg-stone-50 rounded-xl p-4">
                    <button
                      onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                      className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                      data-testid="button-decrease-quantity"
                    >
                      <Minus size={18} className="text-stone-600" />
                    </button>
                    <div className="text-center min-w-[60px]">
                      <span className="text-3xl font-bold text-stone-800">{orderQuantity}</span>
                      <p className="text-xs text-stone-500">copie{orderQuantity > 1 ? "s" : ""}</p>
                    </div>
                    <button
                      onClick={() => setOrderQuantity(Math.min(10, orderQuantity + 1))}
                      className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                      data-testid="button-increase-quantity"
                    >
                      <Plus size={18} className="text-stone-600" />
                    </button>
                  </div>
                </div>

                {/* Book Selection */}
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-3 block">
                    Sélectionner le(s) livre(s) à imprimer
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {allBooks.map((book) => {
                      const isSelected = selectedBooksForOrder.includes(book.id);
                      return (
                        <div
                          key={book.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedBooksForOrder(selectedBooksForOrder.filter(id => id !== book.id));
                            } else {
                              setSelectedBooksForOrder([...selectedBooksForOrder, book.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected ? "border-primary bg-primary/5" : "border-stone-200 hover:border-stone-300"
                          }`}
                          data-testid={`book-select-${book.id}`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-stone-300"
                          }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-stone-800 text-sm">{book.childName || "Mon livre"}</p>
                            <p className="text-[10px] text-stone-500">
                              {(book as any).templateSlug === "grossesse" ? "Grossesse" : 
                               (book as any).templateSlug === "adoption" ? "Adoption" : "Naissance"}
                            </p>
                          </div>
                          {book.id === activeBookId && (
                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Actif</span>
                          )}
                        </div>
                      );
                    })}
                    
                    {allBooks.length === 0 && (
                      <div className="text-center py-6 text-stone-500">
                        <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun livre disponible</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {selectedBooksForOrder.length > 0 && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Livres sélectionnés:</span>
                      <span className="font-medium text-stone-800">{selectedBooksForOrder.length}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-stone-600">Copies par livre:</span>
                      <span className="font-medium text-stone-800">{orderQuantity}</span>
                    </div>
                    <div className="border-t border-stone-200 mt-2 pt-2 flex justify-between text-sm">
                      <span className="text-stone-700 font-medium">Total livres:</span>
                      <span className="font-bold text-primary">{selectedBooksForOrder.length * orderQuantity}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowOrderConfigModal(false)}
                    data-testid="button-cancel-order-config"
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmOrder}
                    disabled={selectedBooksForOrder.length === 0}
                    data-testid="button-confirm-order-config"
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
            onClick={() => {
              setShowCheckout(false);
              if (requiresSubscription) {
                setShowTrialExpiredModal(true);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-stone-800">Paiement</h3>
                  <p className="text-xs text-stone-500">{selectedProduct.name} - {selectedProduct.price}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCheckout(false);
                    if (requiresSubscription) {
                      setShowTrialExpiredModal(true);
                    }
                  }}
                  className="p-2 hover:bg-stone-100 rounded-full"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-2 block">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentMethod === "card" ? "border-primary bg-primary/5" : "border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 50 30" className="w-12 h-8">
                          <rect fill="#FFF" x="0" y="0" width="50" height="30" rx="3" stroke="#E5E5E5"/>
                          <circle fill="#EB001B" cx="18" cy="15" r="9"/>
                          <circle fill="#F79E1B" cx="32" cy="15" r="9"/>
                          <path fill="#FF5F00" d="M25,7.5 C27.5,9.5 29,12 29,15 C29,18 27.5,20.5 25,22.5 C22.5,20.5 21,18 21,15 C21,12 22.5,9.5 25,7.5Z"/>
                        </svg>
                        <svg viewBox="0 0 50 30" className="w-12 h-8">
                          <rect fill="#1A1F71" x="0" y="0" width="50" height="30" rx="3"/>
                          <text x="25" y="19" fontSize="12" fill="#FFF" textAnchor="middle" fontWeight="bold" fontStyle="italic">VISA</text>
                        </svg>
                      </div>
                      <span className={`text-xs font-medium ${paymentMethod === "card" ? "text-primary" : "text-stone-600"}`}>Crédit / Débit</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        paymentMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-stone-200"
                      }`}
                    >
                      <svg viewBox="0 0 50 30" className="w-12 h-8">
                        <rect fill="#FFF" x="0" y="0" width="50" height="30" rx="3" stroke="#E5E5E5"/>
                        <text x="25" y="18" fontSize="9" fill="#003087" textAnchor="middle" fontWeight="bold" fontStyle="italic">Pay</text>
                        <text x="25" y="18" fontSize="9" fill="#0070E0" textAnchor="start" fontWeight="bold" fontStyle="italic" dx="8">Pal</text>
                      </svg>
                      <span className={`text-xs font-medium ${paymentMethod === "paypal" ? "text-blue-600" : "text-stone-600"}`}>PayPal</span>
                    </button>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-stone-600 block">Informations personnelles</label>
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                    data-testid="input-checkout-name"
                  />
                  <input
                    type="email"
                    placeholder="Courriel"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                    data-testid="input-checkout-email"
                  />
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                    data-testid="input-checkout-phone"
                  />
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-stone-600 block">Adresse de livraison</label>
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                    data-testid="input-checkout-address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Ville"
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                      data-testid="input-checkout-city"
                    />
                    <input
                      type="text"
                      placeholder="Code postal"
                      value={checkoutForm.postalCode}
                      onChange={(e) => setCheckoutForm({...checkoutForm, postalCode: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                      data-testid="input-checkout-postal"
                    />
                  </div>
                </div>

                {/* Card Details (only if card payment) */}
                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-stone-600 block">Informations de carte</label>
                    <input
                      type="text"
                      placeholder="Numéro de carte"
                      value={checkoutForm.cardNumber}
                      onChange={(e) => setCheckoutForm({...checkoutForm, cardNumber: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                      data-testid="input-checkout-card"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={checkoutForm.expiry}
                        onChange={(e) => setCheckoutForm({...checkoutForm, expiry: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                        data-testid="input-checkout-expiry"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        value={checkoutForm.cvv}
                        onChange={(e) => setCheckoutForm({...checkoutForm, cvv: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:border-primary focus:outline-none"
                        data-testid="input-checkout-cvv"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-700">Vous serez redirigé vers PayPal pour compléter le paiement</p>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                  {selectedProduct.upgradeAdjustment && selectedProduct.upgradeAdjustment > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-amber-700 font-medium mb-1">Ajustement de mise à niveau</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">Différence à régler maintenant</span>
                        <span className="font-bold text-amber-700">{selectedProduct.upgradeAdjustment.toFixed(2).replace('.', ',')} CAD</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">{selectedProduct.name}</span>
                    <span className="font-medium text-stone-800">{selectedProduct.price}{selectedProduct.name.includes("Abonnement") ? "/mois" : ""}</span>
                  </div>
                  {!selectedProduct.name.includes("Abonnement") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600">Livraison Postes Canada</span>
                      <span className="font-medium text-stone-800">12,00 $</span>
                    </div>
                  )}
                  {(() => {
                    const productPrice = parseFloat(selectedProduct.price.replace(',', '.').replace(' $', '').replace('$', ''));
                    const isSubscription = selectedProduct.name.includes("Abonnement");
                    const shipping = isSubscription ? 0 : 12;
                    const subtotal = productPrice + shipping;
                    const tps = isSubscription ? 0 : subtotal * 0.05;
                    const tvq = isSubscription ? 0 : subtotal * 0.09975;
                    const total = subtotal + tps + tvq + (selectedProduct.upgradeAdjustment || 0);
                    return (
                      <>
                        {!isSubscription && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-600">Sous-total</span>
                              <span className="font-medium text-stone-800">{subtotal.toFixed(2).replace('.', ',')} $</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-600">TPS (5%)</span>
                              <span className="font-medium text-stone-800">{tps.toFixed(2).replace('.', ',')} $</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-600">TVQ (9,975%)</span>
                              <span className="font-medium text-stone-800">{tvq.toFixed(2).replace('.', ',')} $</span>
                            </div>
                          </>
                        )}
                        <div className="border-t border-stone-200 pt-2 flex justify-between">
                          <span className="font-bold text-stone-800">{selectedProduct.upgradeAdjustment ? "Total à payer maintenant" : (isSubscription ? "Total mensuel" : "Total")}</span>
                          <span className="font-bold text-stone-800">{total.toFixed(2).replace('.', ',')} ${isSubscription && !selectedProduct.upgradeAdjustment ? "/mois" : ""}</span>
                        </div>
                        {selectedProduct.upgradeAdjustment && isSubscription && (
                          <div className="text-xs text-stone-500 pt-1">
                            Puis {selectedProduct.price}/mois à partir du mois prochain
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Submit Button */}
                <Button className="w-full h-12 text-sm font-medium gap-2" data-testid="button-submit-payment">
                  <Lock size={16} />
                  {paymentMethod === "card" ? "Payer maintenant" : "Continuer vers PayPal"}
                </Button>

                <p className="text-[10px] text-stone-400 text-center">
                  Paiement sécurisé. Vos informations sont protégées.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Subscription Modal */}
      <AnimatePresence>
        {showManageSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowManageSubscription(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={20} className="text-primary" />
                  <h3 className="font-bold text-stone-800">Gérer mon abonnement</h3>
                </div>
                <button 
                  onClick={() => setShowManageSubscription(false)}
                  className="p-2 hover:bg-stone-100 rounded-full"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Plan */}
                <div className={`p-4 rounded-xl ${
                  userPlan === "platine" ? "bg-amber-50 border border-amber-200" :
                  "bg-blue-50 border border-blue-200"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      userPlan === "platine" ? "bg-amber-200" : "bg-blue-200"
                    }`}>
                      <Crown size={24} className={userPlan === "platine" ? "text-amber-700" : "text-blue-700"} />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Plan actuel</p>
                      <p className={`font-bold text-lg ${userPlan === "platine" ? "text-amber-700" : "text-blue-700"}`}>
                        {userPlan === "platine" ? "Platine" : "Premium"}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-bold text-stone-800">
                        {userPlan === "platine" ? "4,99 $" : "1,99 $"}
                      </p>
                      <p className="text-xs text-stone-500">par mois</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-stone-400" />
                      <div>
                        <p className="text-xs text-stone-500">Prochain paiement</p>
                        <p className="text-sm font-medium text-stone-800">
                          {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-stone-400" />
                      <div>
                        <p className="text-xs text-stone-500">Mode de paiement</p>
                        <p className="text-sm font-medium text-stone-800">•••• •••• •••• 4242</p>
                      </div>
                    </div>
                    <button className="text-xs text-primary font-medium" data-testid="button-change-payment">
                      Modifier
                    </button>
                  </div>
                </div>

                {/* Upgrade Option */}
                {userPlan === "premium" && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles size={20} className="text-amber-600" />
                      <div>
                        <p className="font-bold text-amber-800">Passez à Platine</p>
                        <p className="text-xs text-amber-700">5 Go de stockage vidéo + fonctionnalités exclusives</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      onClick={() => {
                        setShowManageSubscription(false);
                        setSelectedProduct({ name: "Abonnement Platine", price: "4,99$" });
                        setShowCheckout(true);
                      }}
                      data-testid="button-upgrade-to-platine"
                    >
                      <Crown size={14} className="mr-1" />
                      Passer à Platine - 4,99$/mois
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-stone-400 text-center">
                  Vous pouvez changer de forfait à tout moment — seule la différence sera calculée au prorata.
                </p>

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowManageSubscription(false)}
                    data-testid="button-close-manage"
                  >
                    Fermer
                  </Button>
                  <button
                    className="w-full text-xs text-red-500 hover:text-red-600 py-2"
                    onClick={() => {
                      setShowManageSubscription(false);
                      setShowCancelSubscription(true);
                    }}
                    data-testid="button-cancel-from-manage"
                  >
                    Annuler mon abonnement
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelSubscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelSubscription(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">Annuler votre abonnement?</h3>
                <p className="text-sm text-stone-600 mb-4">
                  Vous êtes sur le point d'annuler votre abonnement {userPlan === "platine" ? "Platine" : "Premium"}. 
                  Vous perdrez accès à:
                </p>

                <div className="text-left bg-stone-50 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <X size={14} className="text-red-500" />
                    <span>Stockage vidéo ({userPlan === "platine" ? "5 Go" : "2 Go"})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <X size={14} className="text-red-500" />
                    <span>QR codes pour les vidéos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <X size={14} className="text-red-500" />
                    <span>Fonctionnalités exclusives</span>
                  </div>
                  {userPlan === "platine" && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <X size={14} className="text-red-500" />
                      <span>Support prioritaire</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-500 mb-4">
                  Votre abonnement restera actif jusqu'au {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}.
                  Vous pouvez réactiver à tout moment.
                </p>

                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => setShowCancelSubscription(false)}
                    data-testid="button-keep-subscription"
                  >
                    Garder mon abonnement
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setUserPlan("base");
                      setShowCancelSubscription(false);
                    }}
                    data-testid="button-confirm-cancel"
                  >
                    Confirmer l'annulation
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Adjustment Modal */}
      <AnimatePresence>
        {showUpgradeModal && upgradeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[75] flex items-center justify-center p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-stone-800">
                  Ajustement immédiat du prix
                </h2>
              </div>
              
              <p className="text-stone-600 mb-4">
                Pour passer au forfait <span className="font-semibold text-amber-700">Platine</span>, 
                nous ajustons simplement la différence entre ce que vous avez déjà payé et ce 
                que vous auriez payé avec ce forfait.
              </p>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Mois d'abonnement</span>
                  <span className="font-medium">{upgradeData.moisEcoules} mois</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Montant dû jusqu'à aujourd'hui</span>
                  <span className="font-medium">{upgradeData.montantDu} CAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Montant déjà payé</span>
                  <span className="font-medium">{upgradeData.montantPaye} CAD</span>
                </div>
                <div className="border-t border-stone-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-stone-800">Différence à régler maintenant</span>
                    <span className="font-bold text-amber-600 text-lg">{upgradeData.differenceImmediate} CAD</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-stone-500 mb-6">
                Votre abonnement Platine commencera ensuite à <span className="font-semibold">{upgradeData.tarifNouveau} CAD / mois</span>.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                  data-testid="button-cancel-upgrade"
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handleConfirmUpgrade}
                  data-testid="button-confirm-upgrade"
                >
                  Confirmer la mise à niveau
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trial Expired Modal */}
      <AnimatePresence>
        {showTrialExpiredModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden my-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Essai terminé</h2>
                <p className="text-white/90 text-sm">
                  Votre période d'essai Premium de 14 jours est terminée
                </p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-center text-stone-600 text-sm">
                  Pour continuer à profiter de toutes les fonctionnalités et conserver vos souvenirs, 
                  choisissez un forfait ci-dessous:
                </p>

                {/* Plan Options */}
                <div className="space-y-3">
                  {/* Base Plan */}
                  <div 
                    className="border-2 border-stone-200 rounded-xl p-4 cursor-pointer hover:border-stone-300 transition-all"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/subscription/select-plan", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ plan: "free" }),
                        });
                        if (response.ok) {
                          setUserPlan("base");
                          setShowTrialExpiredModal(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                        }
                      } catch (error) {
                        console.error("Error selecting plan:", error);
                      }
                    }}
                    data-testid="trial-expired-base"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-800">De base</h3>
                        <p className="text-xs text-stone-500">1 Go de stockage photos</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-stone-800">Gratuit</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-amber-600 text-xs">
                      <AlertTriangle size={12} />
                      <span>Stockage limité, pas de vidéos</span>
                    </div>
                  </div>

                  {/* Premium Plan */}
                  <div 
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${
                      userPlan === 'premium' 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-primary bg-primary/5 hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      if (userPlan !== 'premium') {
                        setSelectedProduct({ name: "Abonnement Premium", price: "1,99 $" });
                        setShowCheckout(true);
                      }
                    }}
                    data-testid="trial-expired-premium"
                  >
                    {userPlan !== 'premium' && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Populaire
                      </div>
                    )}
                    {userPlan === 'premium' && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        Plan actuel
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                          Premium <Crown size={14} className="text-primary" />
                        </h3>
                        <p className="text-xs text-stone-500">2 Go vidéos + photos illimitées</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary">1,99 $</span>
                        <span className="text-xs text-stone-500">/mois jusqu'à l'impression</span>
                      </div>
                    </div>
                  </div>

                  {/* Platine Plan */}
                  <div 
                    className="border-2 border-amber-400 rounded-xl p-4 cursor-pointer bg-amber-50 hover:bg-amber-100 transition-all"
                    onClick={() => {
                      if (userPlan === 'premium') {
                        handleCalculateUpgrade('premium', 'platine');
                        setShowTrialExpiredModal(false);
                      } else {
                        setSelectedProduct({ name: "Abonnement Platine", price: "4,99 $" });
                        setShowCheckout(true);
                      }
                    }}
                    data-testid="trial-expired-platine"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-stone-800 flex items-center gap-2">
                          Platine <Sparkles size={14} className="text-amber-500" />
                        </h3>
                        <p className="text-xs text-stone-500">5 Go vidéos + photos illimitées</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-amber-600">4,99 $</span>
                        <span className="text-xs text-stone-500">/mois jusqu'à l'impression</span>
                      </div>
                    </div>
                    {userPlan === 'premium' && (
                      <div className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>Mise à niveau avec ajustement calculé</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-stone-400 text-center">
                  Annulez à tout moment. Vos données sont sauvegardées.<br />
                  Vous pouvez changer de forfait à tout moment — seule la différence sera calculée au prorata.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Book Confirmation Modal */}
      <AnimatePresence>
        {showDeleteBookModal && bookToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteBookModal(false);
              setBookToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">Supprimer ce livre ?</h3>
                <p className="text-sm text-stone-500">
                  Êtes-vous certain de vouloir supprimer le livre de <span className="font-medium text-stone-700">{bookToDelete.childName}</span> ? 
                  Cette action est irréversible.
                </p>
                {deleteError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{deleteError}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-stone-50 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteBookModal(false);
                    setBookToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  data-testid="button-cancel-delete"
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={confirmDeleteBook}
                  disabled={isDeleting}
                  data-testid="button-confirm-delete"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Added Feedback Toast */}
      <AnimatePresence>
        {pageAddedFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-[70] pointer-events-none"
          >
            <div className="bg-primary text-white rounded-xl p-4 shadow-lg flex items-center gap-3 max-w-md mx-auto">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Page ajoutée</p>
                <p className="text-xs text-white/80">
                  "{pageAddedFeedback.pageTitle}" dans le livre de {pageAddedFeedback.bookName}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Selector Modal */}
      <AnimatePresence>
        {showBookSelectorModal && pendingInspirationPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => {
              setShowBookSelectorModal(false);
              setPendingInspirationPage(null);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-800">Choisir un livre</h3>
                    <p className="text-xs text-stone-500">Dans quel livre ajouter cette page ?</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowBookSelectorModal(false);
                      setPendingInspirationPage(null);
                    }}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                    data-testid="button-close-book-selector"
                  >
                    <X size={20} className="text-stone-500" />
                  </button>
                </div>
              </div>

              {/* Page being added */}
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-b ${pendingInspirationPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                    <span className="text-lg">{pendingInspirationPage.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Page à ajouter</p>
                    <p className="text-sm font-medium text-stone-800">{pendingInspirationPage.title}</p>
                  </div>
                </div>
              </div>

              {/* Book List */}
              <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                {userBooks.map((book) => {
                  const bookImage = book.coverImage || "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop";
                  const isActive = activeBook?.id === book.id;
                  
                  return (
                    <motion.div
                      key={book.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pendingInspirationPage && selectBookForInsert(pendingInspirationPage, book.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isActive 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-white border border-stone-200 hover:border-primary/50'
                      }`}
                      data-testid={`book-selector-${book.id}`}
                    >
                      <div className="w-10 h-12 rounded-lg overflow-hidden shadow-sm">
                        <img 
                          src={bookImage} 
                          className="w-full h-full object-cover" 
                          alt={book.childName}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-stone-900">{book.childName}</p>
                        <p className="text-xs text-stone-500">
                          {book.birthDate ? new Date(book.birthDate).toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' }) : 'En cours'}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Cancel Button */}
              <div className="p-4 border-t border-stone-100">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowBookSelectorModal(false);
                    setPendingInspirationPage(null);
                  }}
                  data-testid="button-cancel-book-selector"
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position Selector Modal */}
      <AnimatePresence>
        {showPositionModal && pendingInspirationPage && selectedBookForInsert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => {
              setShowPositionModal(false);
              setPendingInspirationPage(null);
              setSelectedBookForInsert(null);
              setBookPagesForInsert([]);
            }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-lg">
                      {language === "fr" ? "Où insérer cette page ?" : "Where to insert this page?"}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {language === "fr" ? "Choisissez la position dans le livre" : "Choose position in the book"}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPositionModal(false);
                      setPendingInspirationPage(null);
                      setSelectedBookForInsert(null);
                      setBookPagesForInsert([]);
                    }}
                    className="p-2 hover:bg-stone-100 rounded-full"
                  >
                    <X size={20} className="text-stone-500" />
                  </button>
                </div>
              </div>

              {/* Page to add info */}
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-b ${pendingInspirationPage.color} to-stone-50 rounded-xl flex items-center justify-center`}>
                    <span className="text-lg">{pendingInspirationPage.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">{language === "fr" ? "Page à ajouter" : "Page to add"}</p>
                    <p className="text-sm font-medium text-stone-800">{pendingInspirationPage.title}</p>
                  </div>
                </div>
              </div>

              {/* Position List */}
              <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                {/* Insert at beginning */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addPageToBook(pendingInspirationPage, selectedBookForInsert, 0)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all bg-primary/10 border-2 border-primary hover:bg-primary/20"
                  data-testid="position-start"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <ArrowUp size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900">
                      {language === "fr" ? "Au début du livre" : "At the beginning"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {language === "fr" ? "Avant toutes les pages" : "Before all pages"}
                    </p>
                  </div>
                </motion.div>

                {/* Insert after specific pages */}
                {bookPagesForInsert.map((page, idx) => (
                  <motion.div
                    key={page.id || idx}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addPageToBook(pendingInspirationPage, selectedBookForInsert, idx + 1)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all bg-white border border-stone-200 hover:border-primary/50"
                    data-testid={`position-after-${idx}`}
                  >
                    <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-600 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800 text-sm">
                        {language === "fr" ? "Après : " : "After: "}
                        {page.title || page.type || `Page ${idx + 1}`}
                      </p>
                      <p className="text-xs text-stone-500">
                        {language === "fr" ? `Insérer en position ${idx + 2}` : `Insert at position ${idx + 2}`}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Insert at end */}
                {bookPagesForInsert.length > 0 && (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addPageToBook(pendingInspirationPage, selectedBookForInsert, bookPagesForInsert.length)}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all bg-secondary/10 border-2 border-secondary hover:bg-secondary/20"
                    data-testid="position-end"
                  >
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <ArrowDown size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900">
                        {language === "fr" ? "À la fin du livre" : "At the end"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {language === "fr" ? "Après toutes les pages" : "After all pages"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Cancel Button */}
              <div className="p-4 border-t border-stone-100">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setShowPositionModal(false);
                    setPendingInspirationPage(null);
                    setSelectedBookForInsert(null);
                    setBookPagesForInsert([]);
                  }}
                  data-testid="button-cancel-position-selector"
                >
                  {language === "fr" ? "Annuler" : "Cancel"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <div className="h-1 bg-stone-100">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((tutorialStep + 1) / tutorialSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Tutorial Content */}
              <div className="p-6 text-center">
                {/* Step Indicator */}
                <div className="flex justify-center gap-1.5 mb-6">
                  {tutorialSteps.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === tutorialStep 
                          ? 'bg-primary w-6' 
                          : idx < tutorialStep 
                            ? 'bg-primary' 
                            : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Icon */}
                <motion.div
                  key={tutorialStep}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                >
                  <span className="text-4xl">{tutorialSteps[tutorialStep].icon}</span>
                </motion.div>

                {/* Title & Description */}
                <motion.div
                  key={`content-${tutorialStep}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-xl font-bold text-stone-800 mb-3">
                    {tutorialSteps[tutorialStep].title}
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed mb-6">
                    {tutorialSteps[tutorialStep].description}
                  </p>
                </motion.div>

                {/* Visual Hint for specific steps */}
                {tutorialSteps[tutorialStep].target === "quick-actions" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center gap-4 mb-6"
                  >
                    <div className="flex flex-col items-center gap-1 p-3 bg-blue-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ImageIcon size={18} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] text-blue-600 font-medium">Photo</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 bg-purple-50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Video size={18} className="text-purple-600" />
                      </div>
                      <span className="text-[10px] text-purple-600 font-medium">Vidéo</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-3 bg-primary/5 rounded-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar size={18} className="text-primary" />
                      </div>
                      <span className="text-[10px] text-primary font-medium">Étape</span>
                    </div>
                  </motion.div>
                )}

                {tutorialSteps[tutorialStep].target === "inspiration" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center gap-2 mb-6 overflow-x-auto"
                  >
                    {["👨‍👩‍👧‍👦", "🤰", "🔊", "🎉"].map((emoji, idx) => (
                      <div key={idx} className="flex-shrink-0 w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                        <span className="text-xl">{emoji}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {tutorialSteps[tutorialStep].target === "order" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center gap-3 mb-6"
                  >
                    <div className="flex flex-col items-center p-3 bg-stone-50 rounded-xl">
                      <Printer size={24} className="text-stone-600 mb-1" />
                      <span className="text-[10px] text-stone-600 font-medium">Imprimé</span>
                    </div>
                    <div className="flex flex-col items-center p-3 bg-blue-50 rounded-xl">
                      <QrCode size={24} className="text-blue-600 mb-1" />
                      <span className="text-[10px] text-blue-600 font-medium">E-Book</span>
                    </div>
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  {tutorialStep === 0 ? (
                    <button
                      onClick={skipTutorial}
                      className="flex-1 py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                      data-testid="tutorial-skip"
                    >
                      Passer le tutoriel
                    </button>
                  ) : (
                    <button
                      onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                      className="flex-1 py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                      data-testid="tutorial-prev"
                    >
                      Précédent
                    </button>
                  )}
                  <Button
                    onClick={nextTutorialStep}
                    className="flex-1 h-12 gap-2"
                    data-testid="tutorial-next"
                  >
                    {tutorialStep === tutorialSteps.length - 1 ? (
                      <>Commencer <CheckCircle size={16} /></>
                    ) : (
                      <>Suivant <ChevronRight size={16} /></>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-photo-modal-title">Ajouter une photo</h3>
                <button onClick={() => setShowPhotoModal(false)} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-photo-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
                  data-testid="button-take-photo"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Camera size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Prendre une photo</p>
                    <p className="text-xs text-stone-400 mt-1">Ouvrir l'appareil photo</p>
                  </div>
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-violet-500 hover:bg-violet-50 transition-colors"
                  data-testid="button-gallery"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <ImageIcon size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Galerie</p>
                    <p className="text-xs text-stone-400 mt-1">Choisir une photo existante</p>
                  </div>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
                data-testid="input-camera"
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
                data-testid="input-gallery"
              />

              {isUploading && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Ajout en cours...</span>
                </div>
              )}

              <Button onClick={() => setShowPhotoModal(false)} variant="outline" className="w-full" data-testid="button-cancel-photo">
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}