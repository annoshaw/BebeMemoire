import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Minus, Image as ImageIcon, Mic, Video, MoreHorizontal, Calendar, Share2, BookOpen, Printer, CheckCircle, Bell, QrCode, Baby, LogOut, Settings, User, Sparkles, ShoppingBag, FolderHeart, Trash2, Crown, Mail, Phone, MapPin, UserPlus, Users, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Prototype() {
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

  const [userPlan, setUserPlan] = useState<"base" | "premium" | "platine">("base");
  const [userInfo, setUserInfo] = useState({
    name: "Marie Dupond-Martin",
    email: "marie@example.com",
    phone: "+1 (514) 555-1234",
    address: "123 Rue des Érables, Montréal, QC",
    gender: "Femme"
  });
  const [invitedUsers, setInvitedUsers] = useState([
    { id: 1, name: "Jean Martin", email: "jean@example.com" }
  ]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [showAddPageMenu, setShowAddPageMenu] = useState(false);

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
                  <h4 className="text-sm font-bold text-stone-900">{babyName} a 6 mois aujourd'hui ! 🎉</h4>
                  <p className="text-xs text-stone-500 mt-1">C'est le moment idéal pour prendre une photo de son évolution.</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
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
            <span className="text-[10px] text-stone-400 font-medium bg-stone-100 px-2 py-0.5 rounded-full">Famille Dupond-Martin</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-stone-50 rounded-full -mr-2">
                <MoreHorizontal className="text-stone-800" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <User size={16} className="mr-2" />
                <span>Mon Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings size={16} className="mr-2" />
                <span>Paramètres</span>
              </DropdownMenuItem>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-stone-50 relative">
          {/* Hero Cover of the Book */}
          <Link href="/app/edit">
            <button className="w-full h-48 bg-stone-200 relative hover:opacity-80 transition-opacity cursor-pointer" data-testid="button-open-book">
              <img 
                src="https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=800&auto=format&fit=crop" 
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
              <span className="block text-lg font-bold text-stone-800">42</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Souvenirs</span>
            </div>
            <div className="h-8 w-px bg-stone-100"></div>
            <div className="text-center">
              <span className="block text-lg font-bold text-stone-800">12</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Mois</span>
            </div>
            <div className="h-8 w-px bg-stone-100"></div>
             <div className="text-center">
              <span className="block text-lg font-bold text-stone-800">85%</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-400">Complet</span>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'order' ? (
            // Order/Commander options
            <div className="p-4 space-y-4 pb-24">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Charte de prix</h3>
                <p className="text-xs text-stone-500">Livre couverture souple - 50 pages</p>
              </div>

              {/* Price Chart Header */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-4 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={20} className="text-amber-500" />
                  <h4 className="font-bold text-stone-800 text-sm">Choisissez votre forfait</h4>
                </div>
                <p className="text-xs text-stone-600">Seules les pages complétées seront imprimées</p>
              </div>
              
              {/* Base Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all cursor-pointer ${userPlan === 'base' ? 'border-primary' : 'border-stone-100'}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-stone-200 to-stone-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <BookOpen size={20} className="text-stone-600 mb-1" />
                      <span className="text-[8px] font-bold text-stone-500">SOUPLE</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-800 text-sm">Forfait de base</h4>
                        {userPlan === 'base' && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Votre forfait</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Livre couverture souple 50 pages</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-stone-800">43,24 $</span>
                        <Button size="sm" className="h-8 text-xs px-4" data-testid="button-order-base">
                          Commander
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Premium Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all cursor-pointer ${userPlan === 'premium' ? 'border-blue-400' : 'border-stone-100'}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-blue-200 to-blue-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <Crown size={20} className="text-blue-600 mb-1" />
                      <span className="text-[8px] font-bold text-blue-600">PREMIUM</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-800 text-sm">Abonnement Premium</h4>
                        {userPlan === 'premium' && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Votre forfait</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Livre couverture souple 50 pages + avantages</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-blue-700">67,12 $</span>
                        <Button size="sm" className="h-8 text-xs px-4 bg-blue-600 hover:bg-blue-700" data-testid="button-order-premium">
                          Commander
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Platine Plan */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`relative bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all cursor-pointer ${userPlan === 'platine' ? 'border-amber-400' : 'border-amber-200'}`}
              >
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                  POPULAIRE
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-amber-300 to-amber-200 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <Crown size={20} className="text-amber-700 mb-1" />
                      <span className="text-[8px] font-bold text-amber-700">PLATINE</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-800 text-sm">Abonnement Platine</h4>
                        {userPlan === 'platine' && (
                          <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Votre forfait</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">Livre couverture souple 50 pages + tous les avantages</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-amber-700">103,12 $</span>
                        <Button size="sm" className="h-8 text-xs px-4 bg-amber-600 hover:bg-amber-700" data-testid="button-order-platine">
                          Commander
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Info Note */}
              <div className="bg-stone-50 rounded-xl p-3 mt-4">
                <p className="text-xs text-stone-500 text-center">
                  Les prix incluent l'impression et la livraison standard au Canada
                </p>
              </div>
            </div>
          ) : activeTab === 'inspiration' ? (
            // Inspiration tab
            <div className="p-4 space-y-4 pb-24">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Pages d'inspiration</h3>
                <p className="text-xs text-stone-500">Ajoutez ces pages spéciales à votre livre</p>
              </div>
              
              {[
                { title: "Annonce de grossesse", desc: "Partagez la grande nouvelle", icon: "🤰", color: "from-pink-100" },
                { title: "Échographie", desc: "Les premiers aperçus", icon: "🔊", color: "from-purple-100" },
                { title: "Révélation du sexe", desc: "Fille ou garçon?", icon: "🎀", color: "from-blue-100" },
                { title: "Baby Shower", desc: "Célébrez avec vos proches", icon: "🎉", color: "from-yellow-100" },
                { title: "Chambre de bébé", desc: "Le nid douillet", icon: "🛏️", color: "from-green-100" },
                { title: "Lettre à bébé", desc: "Vos mots d'amour", icon: "💌", color: "from-red-100" },
              ].map((item, idx) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
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
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        <Plus size={14} className="mr-1" /> Ajouter
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : activeTab === 'account' ? (
            // Account tab
            <div className="p-4 space-y-4 pb-24 overflow-y-auto">
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
                  <button className="p-2 hover:bg-stone-100 rounded-full">
                    <Edit2 size={16} className="text-stone-500" />
                  </button>
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown size={18} className="text-amber-500" />
                  <h4 className="font-bold text-stone-800 text-sm">Mon abonnement</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "base", label: "De base", price: "Gratuit", color: "stone" },
                    { id: "premium", label: "Premium", price: "9,99$/mois", color: "blue" },
                    { id: "platine", label: "Platine", price: "19,99$/mois", color: "amber" },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setUserPlan(plan.id as any)}
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
                {userPlan !== "platine" && (
                  <Button size="sm" className="w-full mt-3 h-8 text-xs">
                    Passer à {userPlan === "base" ? "Premium" : "Platine"}
                  </Button>
                )}
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-stone-800 text-sm">Informations personnelles</h4>
                  <button className="text-xs text-primary font-medium">Modifier</button>
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
            // Mes créations - Book View
            <div className="flex-1 flex flex-col pb-20">
              {/* Book Title */}
              <div className="p-4 text-center">
                <h3 className="text-lg font-serif font-bold text-stone-800">L'histoire de {babyName}</h3>
                <p className="text-xs text-stone-500">Page {currentPage + 1} sur {bookPages.length}</p>
              </div>

              {/* Book Page Display */}
              <div className="flex-1 px-4 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden h-full min-h-[350px]"
                  >
                    {bookPages[currentPage]?.type === "cover" ? (
                      <div className="h-full relative">
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
                      <div className="h-full p-6 bg-gradient-to-br from-secondary/10 to-white flex flex-col justify-center">
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
                      <div className="h-full flex flex-col">
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
                      <div className="h-full p-6 bg-gradient-to-br from-primary/10 to-white flex flex-col justify-center text-center">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar size={32} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">{bookPages[currentPage].title}</h3>
                        <p className="text-sm text-stone-500 mb-4">{bookPages[currentPage].date}</p>
                        <p className="text-stone-600">{bookPages[currentPage].desc}</p>
                      </div>
                    ) : bookPages[currentPage]?.type === "basic" ? (
                      <div className="h-full flex flex-col bg-white">
                        <div className="flex-1 bg-stone-100 flex items-center justify-center border-b border-stone-200">
                          <button className="flex flex-col items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors">
                            <div className="w-16 h-16 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center">
                              <ImageIcon size={28} />
                            </div>
                            <span className="text-sm">Ajouter une photo</span>
                          </button>
                        </div>
                        <div className="p-4 flex-1">
                          <input 
                            type="text"
                            defaultValue={bookPages[currentPage].title}
                            placeholder="Titre de la page"
                            className="w-full text-lg font-bold text-stone-800 bg-transparent border-none outline-none mb-2 placeholder:text-stone-300"
                          />
                          <textarea
                            defaultValue={bookPages[currentPage].desc}
                            placeholder="Ajoutez votre texte ici..."
                            className="w-full text-sm text-stone-600 bg-transparent border-none outline-none resize-none h-24 placeholder:text-stone-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-full p-6 flex flex-col items-center justify-center text-center bg-stone-50">
                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-4">
                          <Plus size={32} className="text-stone-400" />
                        </div>
                        <h3 className="font-bold text-stone-600 mb-2">{bookPages[currentPage]?.title || "Page vide"}</h3>
                        <p className="text-sm text-stone-400">{bookPages[currentPage]?.desc || "Ajoutez du contenu"}</p>
                        <Button className="mt-4" size="sm">
                          <ImageIcon size={16} className="mr-2" /> Ajouter une photo
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button 
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                  data-testid="button-prev-page"
                >
                  <ChevronLeft size={24} className="text-stone-700" />
                </button>
                <button 
                  onClick={nextPage}
                  disabled={currentPage === bookPages.length - 1}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-colors"
                  data-testid="button-next-page"
                >
                  <ChevronRight size={24} className="text-stone-700" />
                </button>
              </div>

              {/* Page Controls */}
              <div className="p-4 flex items-center justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deletePage}
                  disabled={currentPage === 0 || bookPages.length <= 1}
                  className="h-10 px-4 gap-2"
                  data-testid="button-delete-page"
                >
                  <Minus size={16} />
                  Supprimer
                </Button>
                <div className="flex gap-1">
                  {bookPages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${currentPage === idx ? 'bg-primary' : 'bg-stone-300'}`}
                    />
                  ))}
                </div>
                <div className="relative">
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddPageMenu(!showAddPageMenu)}
                    className="h-10 px-4 gap-2"
                    data-testid="button-add-page"
                  >
                    <Plus size={16} />
                    Ajouter
                  </Button>
                  {showAddPageMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute bottom-full mb-2 right-0 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden min-w-[200px] z-50"
                    >
                      <button
                        onClick={goToInspiration}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-stone-800 hover:bg-stone-50 flex items-center gap-3 border-b border-stone-100"
                        data-testid="button-go-to-inspiration"
                      >
                        <Sparkles size={18} className="text-primary" />
                        Aller à l'Inspiration
                      </button>
                      <button
                        onClick={addBasicPage}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-stone-800 hover:bg-stone-50 flex items-center gap-3"
                        data-testid="button-add-basic-page"
                      >
                        <ImageIcon size={18} className="text-secondary" />
                        Page texte et photo
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <Link href="/app/create">
          <div className="absolute bottom-20 right-6 z-20">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center"
              data-testid="button-create-memory"
            >
              <Plus size={28} />
            </motion.button>
          </div>
        </Link>

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
    </div>
  );
}