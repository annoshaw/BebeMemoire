import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Image as ImageIcon, Mic, Video, MoreHorizontal, Calendar, Share2, BookOpen, Printer, CheckCircle, Bell, QrCode, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Prototype() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [showNotification, setShowNotification] = useState(true);
  
  const babyName = typeof window !== "undefined" ? localStorage.getItem("babyName") || "Léo" : "Léo";

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
          <button className="p-2 hover:bg-stone-50 rounded-full -mr-2">
            <MoreHorizontal className="text-stone-800" />
          </button>
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
          {activeTab === 'print' ? (
            // Print format options
            <div className="p-4 space-y-4 pb-24">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-stone-800 mb-1">Choisir un format</h3>
                <p className="text-xs text-stone-500">Seules les pages complétées seront imprimées</p>
              </div>
              
              {/* 8x11 Hardcover */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-primary/20 to-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-stone-600">8x11</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-800 text-sm">Couverture Rigide</h4>
                      <p className="text-xs text-stone-500 mt-1">Reliure premium avec couverture rigide</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-medium text-primary">12,99 €</span>
                        <Button size="sm" className="h-6 text-xs">Commander</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 8x11 Softcover */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-secondary/20 to-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-stone-600">8x11</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-stone-800 text-sm">Couverture Souple</h4>
                      <p className="text-xs text-stone-500 mt-1">Reliure pratique avec couverture souple</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-medium text-primary">8,99 €</span>
                        <Button size="sm" className="h-6 text-xs">Commander</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            // Timeline Feed
            <div className="p-4 space-y-6 pb-24">
              {memories.map((memory, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={memory.id} 
                  className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden"
                >
                  {/* Special Birth Card */}
                  {memory.isBirthCard ? (
                     <div className="p-6 bg-gradient-to-br from-white to-stone-50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center">
                            <Baby size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-800">{memory.title}</h3>
                            <p className="text-xs text-stone-400">{memory.date}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(memory.stats || {}).map(([key, value]) => (
                            <div key={key} className="bg-white border border-stone-100 rounded-xl p-2 text-center">
                              <span className="block text-sm font-bold text-stone-800">{value}</span>
                              <span className="text-[10px] text-stone-400 uppercase">{key}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${memory.accent || "bg-stone-100 text-stone-600"}`}>
                          {memory.type === "photo" && <ImageIcon size={18} />}
                          {memory.type === "video" && <Video size={18} />}
                          {memory.type === "milestone" && <Calendar size={18} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800 text-sm">{memory.title}</h3>
                          <p className="text-xs text-stone-400">{memory.date}</p>
                        </div>
                      </div>

                      {/* Media */}
                      {memory.image && (
                        <div className="relative aspect-square bg-stone-100">
                          <img src={memory.image} alt={memory.title} className="w-full h-full object-cover" />
                          {memory.isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg mb-2">
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-stone-900 border-b-[6px] border-b-transparent ml-1"></div>
                              </div>
                              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold">
                                <QrCode size={12} />
                                <span>QR LINKED</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caption */}
                      {memory.desc && (
                        <div className="p-4 pt-3">
                          <p className="text-stone-600 text-sm leading-relaxed">{memory.desc}</p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
              
              <div className="text-center py-8">
                  <p className="text-xs text-stone-400 mb-2">C'est tout pour le moment</p>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
                      Charger les mois précédents
                  </Button>
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
          <button className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'timeline' ? 'text-primary' : 'text-stone-400'}`} onClick={() => setActiveTab('timeline')}>
            <BookOpen size={20} />
            <span className="text-[10px] font-medium">Livre</span>
          </button>
          <button className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'media' ? 'text-primary' : 'text-stone-400'}`} onClick={() => setActiveTab('media')}>
            <ImageIcon size={20} />
            <span className="text-[10px] font-medium">Média</span>
          </button>
          <div className="w-8"></div> {/* Spacer for FAB */}
          <button className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'print' ? 'text-primary' : 'text-stone-400'}`} onClick={() => setActiveTab('print')}>
            <Printer size={20} />
            <span className="text-[10px] font-medium">Imprimer</span>
          </button>
          <button className={`p-2 flex flex-col items-center gap-1 ${activeTab === 'share' ? 'text-primary' : 'text-stone-400'}`} onClick={() => setActiveTab('share')}>
            <Share2 size={20} />
            <span className="text-[10px] font-medium">Partage</span>
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