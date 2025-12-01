import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Type, Camera, Video, X, QrCode, Layout, Plus, LayoutTemplate, Sparkles, ImagePlus, Wand2, Image as ImageIcon, Users, Trash2, Lightbulb, Baby, Heart, Star, Cake, Sun, Moon, Gift, Footprints, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type EditorMode = "view" | "text" | "photo" | "video" | "qrcode" | "layout";
type LayoutStyle = "auto" | "classic" | "modern" | "elegant" | "playful" | "minimal" | "story" | "colorful" | "family" | "familyTree" | "journi" | "mosaic";

type ContentItem = {
  type: "text" | "photo" | "video" | "qrcode";
  value?: string;
  videoUrl?: string;
  imageUrl?: string;
};

type FamilyMember = {
  id: number;
  photo: string;
  name: string;
  description: string;
};

type TreeLevel = "grandparents" | "parents" | "child";

type TreeMember = {
  id: number;
  level: TreeLevel;
  photo: string;
  name: string;
  role: string;
};

type BookPage = {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  images: string[];
  layoutStyle: LayoutStyle;
  content: ContentItem[];
  familyMembers?: FamilyMember[];
  treeMembers?: TreeMember[];
};

const sampleImages = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?q=80&w=400&auto=format&fit=crop",
];

const layoutStyles = [
  { id: "auto", name: "Automatique", icon: "✨", desc: "S'adapte au nombre de photos", color: "from-violet-500 to-purple-500" },
  { id: "classic", name: "Classique", icon: "🖼️", desc: "Photo principale + texte élégant", color: "from-amber-500 to-orange-500" },
  { id: "modern", name: "Moderne", icon: "🎨", desc: "Grille dynamique créative", color: "from-blue-500 to-cyan-500" },
  { id: "elegant", name: "Élégant", icon: "💎", desc: "Mise en page raffinée", color: "from-rose-500 to-pink-500" },
  { id: "playful", name: "Ludique", icon: "🎈", desc: "Disposition amusante", color: "from-green-500 to-emerald-500" },
  { id: "minimal", name: "Minimal", icon: "◻️", desc: "Épuré et simple", color: "from-stone-500 to-slate-500" },
  { id: "story", name: "Histoire", icon: "📖", desc: "Narration visuelle", color: "from-indigo-500 to-blue-500" },
  { id: "colorful", name: "Coloré", icon: "🌈", desc: "Couleurs extraites de la photo", color: "from-pink-500 to-yellow-500" },
  { id: "family", name: "Famille", icon: "👨‍👩‍👧‍👦", desc: "Portraits de famille (1-4 personnes)", color: "from-rose-400 to-orange-400" },
  { id: "familyTree", name: "Arbre", icon: "🌳", desc: "Arbre généalogique adaptatif", color: "from-green-500 to-emerald-500" },
  { id: "journi", name: "Journi", icon: "📸", desc: "Style magazine asymétrique", color: "from-teal-500 to-cyan-500" },
  { id: "mosaic", name: "Mosaïque", icon: "🧩", desc: "Collage créatif varié", color: "from-fuchsia-500 to-pink-500" },
];

type InspirationCategory = "famille" | "grossesse" | "echographie" | "parcours" | "evenements" | "naissance" | "premiers" | "fetes" | "quotidien";

type InspirationTemplate = {
  id: string;
  category: InspirationCategory;
  title: string;
  subtitle: string;
  description: string;
  layoutStyle: LayoutStyle;
  icon: string;
  color: string;
  previewImage?: string;
};

const inspirationCategories = [
  { id: "famille", name: "Présentation de la famille", icon: Users, color: "from-teal-400 to-emerald-500" },
  { id: "grossesse", name: "Annonce de grossesse", icon: Heart, color: "from-pink-400 to-rose-500" },
  { id: "echographie", name: "Échographies", icon: Baby, color: "from-purple-400 to-indigo-500" },
  { id: "parcours", name: "Parcours spéciaux", icon: Star, color: "from-orange-400 to-amber-500" },
  { id: "evenements", name: "Événements grossesse", icon: Gift, color: "from-yellow-400 to-orange-500" },
  { id: "naissance", name: "Naissance", icon: Baby, color: "from-blue-400 to-cyan-500" },
  { id: "premiers", name: "Premières fois", icon: Footprints, color: "from-amber-400 to-orange-500" },
  { id: "fetes", name: "Fêtes & célébrations", icon: Cake, color: "from-fuchsia-400 to-pink-500" },
  { id: "quotidien", name: "Vie quotidienne", icon: Sun, color: "from-green-400 to-teal-500" },
];

const inspirationTemplates: InspirationTemplate[] = [
  // FAMILLE - Présentation de la famille
  { id: "famille1", category: "famille", title: "TA", subtitle: "FAMILLE", description: "Qui sommes-nous? Une présentation de ceux qui t'aiment.", layoutStyle: "family", icon: "👨‍👩‍👧‍👦", color: "from-teal-300 to-emerald-400" },
  { id: "arbre", category: "famille", title: "ARBRE", subtitle: "GÉNÉALOGIQUE", description: "Tes racines et ton histoire familiale.", layoutStyle: "familyTree", icon: "🌳", color: "from-green-300 to-teal-400" },
  { id: "parents", category: "famille", title: "TES", subtitle: "PARENTS", description: "Maman et Papa, ceux qui veillent sur toi.", layoutStyle: "elegant", icon: "💑", color: "from-rose-300 to-pink-400" },
  { id: "grandparents", category: "famille", title: "TES", subtitle: "GRANDS-PARENTS", description: "Mamie et Papi, leurs bras sont toujours ouverts.", layoutStyle: "journi", icon: "👵", color: "from-amber-300 to-orange-400" },
  { id: "oncles", category: "famille", title: "TES ONCLES", subtitle: "& TANTES", description: "La famille élargie qui t'entoure d'amour.", layoutStyle: "modern", icon: "👫", color: "from-blue-300 to-indigo-400" },
  { id: "parrain", category: "famille", title: "TON PARRAIN", subtitle: "& TA MARRAINE", description: "Ceux qui ont été choisis pour te guider.", layoutStyle: "classic", icon: "⭐", color: "from-purple-300 to-violet-400" },
  { id: "cousins", category: "famille", title: "TES COUSINS", subtitle: "& COUSINES", description: "Tes compagnons de jeux et d'aventures.", layoutStyle: "playful", icon: "👧", color: "from-pink-300 to-rose-400" },
  { id: "amis", category: "famille", title: "LES AMIS", subtitle: "DE LA FAMILLE", description: "Ces personnes spéciales qui font partie de ta vie.", layoutStyle: "journi", icon: "🤝", color: "from-cyan-300 to-blue-400" },
  { id: "animaux", category: "famille", title: "NOS ANIMAUX", subtitle: "DE COMPAGNIE", description: "Tes compagnons à quatre pattes.", layoutStyle: "mosaic", icon: "🐾", color: "from-amber-300 to-yellow-400" },
  
  // GROSSESSE - Annonce de grossesse
  { id: "annonce1", category: "grossesse", title: "QUAND J'AI", subtitle: "APPRIS LA NOUVELLE", description: "Le moment où tout a basculé, cette émotion incroyable.", layoutStyle: "elegant", icon: "💝", color: "from-pink-400 to-rose-400" },
  { id: "annoncePere", category: "grossesse", title: "QUAND TON PÈRE", subtitle: "A APPRIS", description: "Sa réaction, ses premiers mots, son émotion.", layoutStyle: "classic", icon: "👨", color: "from-blue-300 to-indigo-400" },
  { id: "annonceMere", category: "grossesse", title: "QUAND TA MÈRE", subtitle: "A APPRIS", description: "Ce moment unique gravé dans mon cœur.", layoutStyle: "classic", icon: "👩", color: "from-rose-300 to-pink-400" },
  { id: "annonceGP", category: "grossesse", title: "QUAND LES", subtitle: "GRANDS-PARENTS ONT APPRIS", description: "Leur joie de devenir mamie et papi.", layoutStyle: "journi", icon: "👴", color: "from-amber-300 to-orange-400" },
  { id: "annonceFamille", category: "grossesse", title: "QUAND LA FAMILLE", subtitle: "A APPRIS", description: "Le bonheur partagé avec nos proches.", layoutStyle: "mosaic", icon: "👨‍👩‍👧‍👦", color: "from-teal-300 to-emerald-400" },
  
  // ÉCHOGRAPHIES
  { id: "echo1", category: "echographie", title: "TA PREMIÈRE", subtitle: "ÉCHOGRAPHIE", description: "Notre première rencontre avec toi, une émotion indescriptible.", layoutStyle: "classic", icon: "🔊", color: "from-purple-300 to-indigo-400" },
  { id: "echo2", category: "echographie", title: "TA DEUXIÈME", subtitle: "ÉCHOGRAPHIE", description: "Tu grandis et on te découvre un peu plus.", layoutStyle: "elegant", icon: "👶", color: "from-blue-300 to-purple-400" },
  { id: "echo3", category: "echographie", title: "TA TROISIÈME", subtitle: "ÉCHOGRAPHIE", description: "Bientôt là, on compte les jours.", layoutStyle: "journi", icon: "💜", color: "from-violet-300 to-purple-400" },
  { id: "echoSuivi", category: "echographie", title: "LES ÉCHOS", subtitle: "DE SUIVI", description: "Suivre ta croissance semaine après semaine.", layoutStyle: "mosaic", icon: "📊", color: "from-indigo-300 to-blue-400" },
  { id: "coeur", category: "echographie", title: "LA PREMIÈRE FOIS", subtitle: "QUE J'AI ENTENDU TON CŒUR", description: "Ce petit battement qui a fait chavirer le mien.", layoutStyle: "minimal", icon: "💓", color: "from-red-300 to-rose-400" },
  
  // PARCOURS SPÉCIAUX
  { id: "adoption", category: "parcours", title: "NOTRE PARCOURS", subtitle: "D'ADOPTION", description: "L'histoire de comment tu es arrivé(e) dans nos vies.", layoutStyle: "story", icon: "💕", color: "from-blue-300 to-cyan-400" },
  { id: "fiv", category: "parcours", title: "NOTRE PARCOURS", subtitle: "DE FERTILITÉ", description: "Le chemin qui nous a menés jusqu'à toi.", layoutStyle: "elegant", icon: "🌱", color: "from-green-300 to-emerald-400" },
  { id: "chambre", category: "parcours", title: "TA", subtitle: "CHAMBRE", description: "Nous avons préparé ce petit nid douillet rien que pour toi.", layoutStyle: "journi", icon: "🛏️", color: "from-teal-300 to-cyan-400" },
  { id: "lettre", category: "parcours", title: "LETTRE", subtitle: "À BÉBÉ", description: "Nos mots d'amour pour toi, à lire plus tard.", layoutStyle: "minimal", icon: "💌", color: "from-rose-300 to-red-400" },
  
  // ÉVÉNEMENTS GROSSESSE
  { id: "parrain", category: "evenements", title: "L'ANNONCE", subtitle: "DU PARRAIN", description: "Quand il a appris qu'il serait ton parrain.", layoutStyle: "classic", icon: "⭐", color: "from-blue-300 to-indigo-400" },
  { id: "marraine", category: "evenements", title: "L'ANNONCE", subtitle: "DE LA MARRAINE", description: "Quand elle a appris qu'elle serait ta marraine.", layoutStyle: "classic", icon: "✨", color: "from-purple-300 to-pink-400" },
  { id: "genderReveal", category: "evenements", title: "LE DÉVOILEMENT", subtitle: "DU SEXE", description: "Fille ou garçon? Le grand moment de vérité!", layoutStyle: "playful", icon: "🎀", color: "from-pink-300 to-blue-400" },
  { id: "babyShower", category: "evenements", title: "LE BABY", subtitle: "SHOWER", description: "Une fête entourée d'amour pour célébrer ton arrivée.", layoutStyle: "mosaic", icon: "🎉", color: "from-yellow-300 to-orange-400" },
  { id: "babyMoon", category: "evenements", title: "LE BABY", subtitle: "MOON", description: "Nos dernières vacances avant ton arrivée.", layoutStyle: "journi", icon: "🌙", color: "from-indigo-300 to-purple-400" },
  { id: "ventre", category: "evenements", title: "MON VENTRE", subtitle: "QUI S'ARRONDIT", description: "Mois après mois, je te sens grandir en moi.", layoutStyle: "story", icon: "🤰", color: "from-rose-300 to-pink-400" },
  
  // NAISSANCE
  { id: "naissance1", category: "naissance", title: "BIENVENUE", subtitle: "AU MONDE", description: "Le plus beau jour de notre vie, tu es enfin là.", layoutStyle: "classic", icon: "👶", color: "from-blue-400 to-cyan-400" },
  { id: "poids", category: "naissance", title: "TES PREMIÈRES", subtitle: "MESURES", description: "Ton poids, ta taille... les premiers chiffres de ta vie.", layoutStyle: "minimal", icon: "📏", color: "from-indigo-300 to-blue-400" },
  { id: "hopital", category: "naissance", title: "À LA", subtitle: "MATERNITÉ", description: "Nos premiers jours ensemble dans ce cocon protégé.", layoutStyle: "journi", icon: "🏥", color: "from-sky-300 to-blue-400" },
  { id: "retour", category: "naissance", title: "RETOUR", subtitle: "À LA MAISON", description: "Enfin chez nous, une nouvelle aventure commence.", layoutStyle: "elegant", icon: "🏡", color: "from-green-300 to-emerald-400" },
  { id: "carteNaissance", category: "naissance", title: "CARTE", subtitle: "DE NAISSANCE", description: "Ton faire-part, l'annonce officielle de ton arrivée.", layoutStyle: "colorful", icon: "📜", color: "from-amber-300 to-yellow-400" },
  
  // PREMIÈRES FOIS
  { id: "premierSourire", category: "premiers", title: "PREMIER", subtitle: "SOURIRE", description: "Ce sourire qui illumine nos journées.", layoutStyle: "classic", icon: "😊", color: "from-yellow-300 to-amber-400" },
  { id: "premiersPas", category: "premiers", title: "PREMIERS", subtitle: "PAS", description: "Ces pas hésitants vers l'aventure.", layoutStyle: "story", icon: "👣", color: "from-orange-300 to-amber-400" },
  { id: "premierMot", category: "premiers", title: "PREMIER", subtitle: "MOT", description: "Ta petite voix qui prononce ses premiers sons.", layoutStyle: "elegant", icon: "💬", color: "from-pink-300 to-rose-400" },
  { id: "premierDent", category: "premiers", title: "PREMIÈRE", subtitle: "DENT", description: "Cette petite perle blanche tant attendue.", layoutStyle: "playful", icon: "🦷", color: "from-cyan-300 to-blue-400" },
  { id: "premierBain", category: "premiers", title: "PREMIER", subtitle: "BAIN", description: "Barbotage et découverte de l'eau.", layoutStyle: "journi", icon: "🛁", color: "from-blue-300 to-cyan-400" },
  { id: "premierRepas", category: "premiers", title: "PREMIER", subtitle: "REPAS SOLIDE", description: "La diversification commence, nouvelles saveurs!", layoutStyle: "mosaic", icon: "🥄", color: "from-green-300 to-emerald-400" },
  { id: "premierNoel", category: "premiers", title: "PREMIER", subtitle: "NOËL", description: "La magie de Noël à travers tes yeux émerveillés.", layoutStyle: "colorful", icon: "🎄", color: "from-red-400 to-green-500" },
  
  // FÊTES & CÉLÉBRATIONS
  { id: "anniversaire1", category: "fetes", title: "1", subtitle: "AN", description: "Ta première bougie, une année de bonheur.", layoutStyle: "playful", icon: "🎂", color: "from-pink-400 to-purple-400" },
  { id: "anniversaire2", category: "fetes", title: "2", subtitle: "ANS", description: "Deux ans déjà, le temps file!", layoutStyle: "mosaic", icon: "🎈", color: "from-blue-400 to-purple-400" },
  { id: "paques", category: "fetes", title: "CHASSE", subtitle: "AUX ŒUFS", description: "À la recherche des trésors chocolatés.", layoutStyle: "playful", icon: "🐰", color: "from-yellow-300 to-pink-400" },
  { id: "halloween", category: "fetes", title: "PREMIER", subtitle: "HALLOWEEN", description: "Ton premier déguisement trop mignon.", layoutStyle: "colorful", icon: "🎃", color: "from-orange-400 to-purple-500" },
  { id: "stValentin", category: "fetes", title: "SAINT", subtitle: "VALENTIN", description: "Notre petit amour à nous.", layoutStyle: "elegant", icon: "💘", color: "from-red-300 to-rose-400" },
  
  // VIE QUOTIDIENNE
  { id: "repas", category: "quotidien", title: "L'HEURE", subtitle: "DU REPAS", description: "Les joies (et les dégâts) de manger.", layoutStyle: "mosaic", icon: "🍽️", color: "from-green-300 to-emerald-400" },
  { id: "dodo", category: "quotidien", title: "DODO", subtitle: "PAISIBLE", description: "Ces moments de calme où tu rêves.", layoutStyle: "minimal", icon: "😴", color: "from-indigo-300 to-purple-400" },
  { id: "jeux", category: "quotidien", title: "TEMPS", subtitle: "DE JEU", description: "Rires, découvertes et imagination.", layoutStyle: "playful", icon: "🧸", color: "from-yellow-300 to-orange-400" },
  { id: "promenade", category: "quotidien", title: "BALADE", subtitle: "AU PARC", description: "Explorer le monde à tes côtés.", layoutStyle: "journi", icon: "🌳", color: "from-green-400 to-teal-400" },
  { id: "lecture", category: "quotidien", title: "MOMENT", subtitle: "LECTURE", description: "Les histoires que nous partageons ensemble.", layoutStyle: "elegant", icon: "📚", color: "from-amber-300 to-orange-400" },
  { id: "musique", category: "quotidien", title: "MUSIQUE", subtitle: "& DANSE", description: "Tu bouges au rythme de la musique.", layoutStyle: "playful", icon: "🎵", color: "from-purple-300 to-pink-400" },
];

const extractDominantColor = (imageUrl: string): Promise<{ primary: string; secondary: string; text: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ primary: "#f5f5f4", secondary: "#e7e5e4", text: "#1c1917" });
        return;
      }
      
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }
      
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      
      const primary = `rgb(${r}, ${g}, ${b})`;
      const secondary = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
      
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const text = luminance > 0.5 ? "#1c1917" : "#fafaf9";
      
      resolve({ primary, secondary, text });
    };
    img.onerror = () => {
      resolve({ primary: "#f5f5f4", secondary: "#e7e5e4", text: "#1c1917" });
    };
    img.src = imageUrl;
  });
};

export default function EditBook() {
  const [editorMode, setEditorMode] = useState<EditorMode>("view");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedText, setSelectedText] = useState("");
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [extractedColors, setExtractedColors] = useState<{ primary: string; secondary: string; text: string }>({ 
    primary: "#f5f5f4", 
    secondary: "#e7e5e4", 
    text: "#1c1917" 
  });
  const [showFamilyEditor, setShowFamilyEditor] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InspirationCategory | null>(null);
  const [showTreeEditor, setShowTreeEditor] = useState(false);
  const [editingTreeMemberIndex, setEditingTreeMemberIndex] = useState<number | null>(null);
  const [selectedTreeLevel, setSelectedTreeLevel] = useState<TreeLevel>("parents");
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const familyPhotoInputRef = useRef<HTMLInputElement>(null);
  const treePhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoCameraRef = useRef<HTMLInputElement>(null);
  const videoGalleryRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const babyName = typeof window !== "undefined" ? localStorage.getItem("babyName") || "Léo" : "Léo";
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      }
    }
    
    if (newImages.length > 0) {
      setPages(prevPages => {
        const newPages = [...prevPages];
        newPages[currentPageIndex].images = [...newPages[currentPageIndex].images, ...newImages];
        return newPages;
      });
    }
    
    setIsUploading(false);
  };

  const generateQRCodeDataUrl = (text: string) => {
    const encodedText = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
  };

  const [pages, setPages] = useState<BookPage[]>([
    {
      id: 1,
      title: "BIENVENUE",
      subtitle: `L'ARRIVÉE DE ${babyName.toUpperCase()}`,
      date: "12 / 01 / 2025",
      description: "Un moment inoubliable, gravé à jamais dans nos cœurs.\n\nLe jour où tu es arrivé(e) parmi nous, le monde s'est illuminé d'une lumière nouvelle.",
      images: sampleImages.slice(0, 6),
      layoutStyle: "auto",
      content: []
    },
    {
      id: 2,
      title: "PREMIERS",
      subtitle: "MOMENTS",
      date: "15 / 01 / 2025",
      description: "Ces instants précieux de découverte.\n\nChaque regard, chaque sourire, chaque petit geste devient un trésor que nous chérissons.",
      images: sampleImages.slice(0, 2),
      layoutStyle: "elegant",
      content: []
    },
    {
      id: 3,
      title: "NOTRE",
      subtitle: "FAMILLE",
      date: "20 / 02 / 2025",
      description: "L'amour qui nous unit.\n\nEnsemble, nous créons les plus beaux souvenirs, un jour à la fois.",
      images: sampleImages.slice(0, 4),
      layoutStyle: "family",
      content: [],
      familyMembers: [
        { id: 1, photo: sampleImages[0], name: "Maman", description: "Le cœur de notre foyer" },
        { id: 2, photo: sampleImages[1], name: "Papa", description: "Notre force et notre pilier" },
        { id: 3, photo: sampleImages[2], name: "Léo", description: "Notre petit trésor" },
      ]
    },
    {
      id: 4,
      title: "SOUVENIR",
      subtitle: "D'UN JOUR SPÉCIAL",
      date: "18 / 06 / 2025",
      description: "Un instant simple, en toute intimité, et un week-end rien que pour nous deux afin de célébrer ce moment.\n\nUne parenthèse enchantée où seuls comptaient l'amour et la complicité qui nous unissaient.",
      images: sampleImages.slice(0, 1),
      layoutStyle: "classic",
      content: []
    },
    {
      id: 5,
      title: "GRANDIR",
      subtitle: "ENSEMBLE",
      date: "25 / 03 / 2025",
      description: "Chaque jour apporte son lot de découvertes et de bonheur.",
      images: sampleImages.slice(0, 3),
      layoutStyle: "playful",
      content: []
    },
    {
      id: 6,
      title: "MOMENTS",
      subtitle: "PRÉCIEUX",
      date: "10 / 04 / 2025",
      description: "Ces instants de pure joie qui illuminent notre quotidien.",
      images: sampleImages.slice(0, 5),
      layoutStyle: "story",
      content: []
    }
  ]);

  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    if (currentPage.layoutStyle === "colorful" && currentPage.images.length > 0) {
      extractDominantColor(currentPage.images[0]).then(setExtractedColors);
    }
  }, [currentPage.layoutStyle, currentPage.images]);

  const updateLayoutStyle = (style: LayoutStyle) => {
    const newPages = [...pages];
    newPages[currentPageIndex].layoutStyle = style;
    setPages(newPages);
    setShowLayoutPicker(false);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const closeEditor = () => {
    setEditorMode("view");
    setSelectedText("");
  };

  const addNewPage = () => {
    const newPage: BookPage = {
      id: Date.now(),
      title: "NOUVELLE",
      subtitle: "PAGE",
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / '),
      description: "Ajoutez votre texte ici...",
      images: [],
      layoutStyle: "auto",
      content: []
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const addInspirationPage = (template: InspirationTemplate) => {
    const newPage: BookPage = {
      id: Date.now(),
      title: template.title,
      subtitle: template.subtitle,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / '),
      description: template.description,
      images: [],
      layoutStyle: template.layoutStyle,
      content: [],
      familyMembers: template.layoutStyle === "family" ? [] : undefined,
      treeMembers: template.layoutStyle === "familyTree" ? [] : undefined
    };
    setPages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
    setShowInspirationModal(false);
    setSelectedCategory(null);
  };

  const getCurrentLayoutName = () => {
    const style = layoutStyles.find(s => s.id === currentPage.layoutStyle);
    return style?.name || "Automatique";
  };

  const renderLayout = (page: BookPage) => {
    const { images, title, subtitle, date, description, layoutStyle } = page;
    const photoCount = images.length;

    if (photoCount === 0) {
      return (
        <div className="w-full h-full bg-white p-8 flex flex-col items-center justify-center" data-testid="layout-empty">
          <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <ImagePlus size={40} className="text-stone-400" />
          </div>
          <p className="text-xs text-stone-400 tracking-widest mb-2" data-testid="text-page-date">{date}</p>
          <h2 className="text-2xl font-serif font-bold text-stone-800 text-center" data-testid="text-page-title">{title}</h2>
          <h3 className="text-xl font-serif text-stone-600 text-center mb-4" data-testid="text-page-subtitle">{subtitle}</h3>
          <p className="text-sm text-stone-500 text-center max-w-xs" data-testid="text-page-description">{description.split('\n')[0]}</p>
          <p className="text-xs text-stone-400 mt-6">Ajoutez des photos pour créer votre mise en page</p>
        </div>
      );
    }

    if (layoutStyle === "classic" || (layoutStyle === "auto" && photoCount === 1)) {
      return (
        <div className="w-full h-full bg-white flex flex-col" data-testid="layout-classic">
          <div className="flex-1 relative">
            <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-main-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-xs tracking-widest mb-2 opacity-80" data-testid="text-page-date">{date}</p>
              <h2 className="text-3xl font-serif font-bold leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-xl font-serif opacity-90" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-stone-600 leading-relaxed" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "elegant" || (layoutStyle === "auto" && photoCount === 2)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-stone-50 to-white p-6 flex flex-col" data-testid="layout-elegant">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-elegant-0" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-elegant-1" />
            </div>
          </div>
          <div className="pt-5 text-center">
            <div className="inline-block px-4 py-1 bg-stone-100 rounded-full mb-2">
              <p className="text-xs text-stone-500 tracking-widest" data-testid="text-page-date">{date}</p>
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-lg font-serif text-stone-500 mb-2" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-sm text-stone-600 italic" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "modern" || (layoutStyle === "auto" && photoCount >= 4)) {
      return (
        <div className="w-full h-full bg-white p-4" data-testid="layout-modern">
          <div className="grid grid-cols-3 gap-2 h-full">
            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-0" />
            </div>
            <div className="rounded-lg overflow-hidden">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-1" />
            </div>
            <div className="rounded-lg overflow-hidden">
              <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-2" />
            </div>
            <div className="bg-primary/10 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[10px] text-primary tracking-widest mb-1" data-testid="text-page-date">{date}</p>
              <h2 className="text-lg font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg overflow-hidden">
                <img src={images[3] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-modern-3" />
              </div>
              <div className="bg-stone-50 rounded-lg p-3 flex items-center">
                <p className="text-[10px] text-stone-600 leading-relaxed line-clamp-4" data-testid="text-page-description">{description}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === "playful" || (layoutStyle === "auto" && photoCount === 3)) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 p-5" data-testid="layout-playful">
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="row-span-2 rounded-3xl overflow-hidden shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-0" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg rotate-[2deg] hover:rotate-0 transition-transform">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-1" />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-lg rotate-[-1deg] hover:rotate-0 transition-transform">
              <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-playful-2" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 rounded-t-3xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎈</span>
              <p className="text-xs text-rose-500 tracking-widest font-medium" data-testid="text-page-date">{date}</p>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-rose-600" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-xs text-stone-500 mt-1" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "minimal") {
      return (
        <div className="w-full h-full bg-white p-8 flex flex-col" data-testid="layout-minimal">
          <div className="text-center mb-6">
            <p className="text-[10px] text-stone-400 tracking-[0.3em] uppercase" data-testid="text-page-date">{date}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-3/4 aspect-square rounded-sm overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-minimal-0" />
            </div>
          </div>
          <div className="text-center mt-6">
            <h2 className="text-xl font-light tracking-wide text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-light text-stone-400 mt-1" data-testid="text-page-subtitle">{subtitle}</h3>
            <div className="w-8 h-px bg-stone-300 mx-auto my-3" />
            <p className="text-xs text-stone-500 max-w-xs mx-auto" data-testid="text-page-description">{description.split('\n')[0]}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "story" || (layoutStyle === "auto" && photoCount >= 5)) {
      return (
        <div className="w-full h-full bg-[#f8f6f3] p-4" data-testid="layout-story">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {images.slice(0, 3).map((img, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden shadow-sm">
                <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-story-${idx}`} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-1 bg-white rounded-lg p-3 flex flex-col justify-center shadow-sm">
              <p className="text-[10px] text-stone-400 tracking-widest mb-1" data-testid="text-page-date">{date}</p>
              <h2 className="text-base font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
              <h3 className="text-sm font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
            </div>
            <div className="col-span-2 bg-white rounded-lg p-3 shadow-sm">
              <p className="text-[10px] text-stone-600 leading-relaxed" data-testid="text-page-description">{description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.slice(3, 6).map((img, idx) => (
              <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
                <img src={img} className="w-full h-full object-cover" alt="" data-testid={`img-story-${idx + 3}`} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (layoutStyle === "colorful") {
      return (
        <div className="w-full h-full flex flex-col" data-testid="layout-colorful">
          <div className="flex-1 relative">
            <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-colorful-0" />
          </div>
          <div 
            className="p-5 transition-colors duration-500"
            style={{ backgroundColor: extractedColors.primary }}
          >
            <p 
              className="text-xs tracking-widest mb-1 opacity-80"
              style={{ color: extractedColors.text }}
              data-testid="text-page-date"
            >
              {date}
            </p>
            <h2 
              className="text-2xl font-serif font-bold leading-tight"
              style={{ color: extractedColors.text }}
              data-testid="text-page-title"
            >
              {title}
            </h2>
            <h3 
              className="text-lg font-serif opacity-90"
              style={{ color: extractedColors.text }}
              data-testid="text-page-subtitle"
            >
              {subtitle}
            </h3>
            <p 
              className="text-sm mt-2 opacity-80"
              style={{ color: extractedColors.text }}
              data-testid="text-page-description"
            >
              {description.split('\n')[0]}
            </p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "family") {
      const members = page.familyMembers || [];
      const memberCount = members.length;
      
      if (memberCount === 0) {
        return (
          <div className="w-full h-full bg-gradient-to-br from-rose-50 to-orange-50 p-6 flex flex-col items-center justify-center" data-testid="layout-family-empty">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-800 mb-2" data-testid="text-page-title">{title}</h2>
            <h3 className="text-lg font-serif text-stone-600 mb-4" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-sm text-stone-500 text-center max-w-xs mb-6">
              Ajoutez les membres de votre famille pour créer une page personnalisée
            </p>
            <div className="flex items-center gap-2 text-rose-500">
              <Plus size={16} />
              <span className="text-sm font-medium">Cliquez sur "Texte" pour ajouter des membres</span>
            </div>
          </div>
        );
      }

      const getGridLayout = () => {
        switch (memberCount) {
          case 1: return "grid-cols-1";
          case 2: return "grid-cols-2";
          case 3: return "grid-cols-3";
          case 4: return "grid-cols-2 grid-rows-2";
          default: return "grid-cols-2";
        }
      };

      const getCardSize = () => {
        switch (memberCount) {
          case 1: return "max-w-xs mx-auto";
          case 2: return "";
          case 3: return "";
          case 4: return "";
          default: return "";
        }
      };

      return (
        <div className="w-full h-full bg-gradient-to-br from-rose-50 via-white to-orange-50 p-4 flex flex-col" data-testid="layout-family">
          <div className="text-center mb-3">
            <p className="text-xs text-rose-500 tracking-widest uppercase" data-testid="text-page-date">{date}</p>
            <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-stone-500" data-testid="text-page-subtitle">{subtitle}</h3>
          </div>
          
          <div className={`grid ${getGridLayout()} gap-3 flex-1 ${memberCount === 1 ? 'place-content-center' : ''}`}>
            {members.map((member, idx) => (
              <div 
                key={member.id} 
                className={`flex flex-col bg-white rounded-xl shadow-md overflow-hidden ${getCardSize()}`}
                data-testid={`family-card-${idx}`}
              >
                <div className={`relative ${memberCount <= 2 ? 'aspect-[4/5]' : 'aspect-square'} bg-stone-100`}>
                  {member.photo ? (
                    <img 
                      src={member.photo} 
                      className="w-full h-full object-cover" 
                      alt={member.name}
                      data-testid={`img-family-${idx}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-orange-100">
                      <ImagePlus size={memberCount <= 2 ? 32 : 24} className="text-rose-300" />
                    </div>
                  )}
                </div>
                <div className={`p-${memberCount <= 2 ? '3' : '2'} text-center bg-gradient-to-b from-white to-rose-50/30`}>
                  <p className={`font-serif font-bold text-stone-800 ${memberCount <= 2 ? 'text-base' : 'text-sm'}`} data-testid={`text-family-name-${idx}`}>
                    {member.name || "Nom"}
                  </p>
                  <p className={`text-stone-500 ${memberCount <= 2 ? 'text-sm' : 'text-xs'} line-clamp-2`} data-testid={`text-family-desc-${idx}`}>
                    {member.description || "Description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (layoutStyle === "familyTree") {
      const members = page.treeMembers || [];
      const grandparents = members.filter(m => m.level === "grandparents");
      const parents = members.filter(m => m.level === "parents");
      const children = members.filter(m => m.level === "child");
      
      const hasAnyMembers = members.length > 0;
      
      if (!hasAnyMembers) {
        return (
          <div className="w-full h-full bg-gradient-to-b from-emerald-50 via-white to-green-50 p-4 flex flex-col items-center justify-center" data-testid="layout-familytree-empty">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-2xl">🌳</span>
            </div>
            <h2 className="text-lg font-serif font-bold text-stone-800 mb-1" data-testid="text-page-title">{title}</h2>
            <h3 className="text-sm font-serif text-stone-500 mb-3" data-testid="text-page-subtitle">{subtitle}</h3>
            <p className="text-xs text-stone-400 text-center max-w-[200px] mb-4">
              Construisez votre arbre généalogique en ajoutant les membres de la famille
            </p>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Plus size={14} />
              <span className="text-xs font-medium">Cliquez sur "Texte" pour ajouter</span>
            </div>
          </div>
        );
      }

      const renderMember = (member: TreeMember, size: "sm" | "md" | "lg" = "md") => {
        const sizeClasses = {
          sm: "w-10 h-10",
          md: "w-12 h-12",
          lg: "w-14 h-14"
        };
        const textSize = size === "sm" ? "text-[9px]" : size === "md" ? "text-[10px]" : "text-xs";
        
        return (
          <div key={member.id} className="flex flex-col items-center" data-testid={`tree-member-${member.id}`}>
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-md bg-stone-100`}>
              {member.photo ? (
                <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100">
                  <Users size={size === "sm" ? 14 : size === "md" ? 16 : 20} className="text-emerald-400" />
                </div>
              )}
            </div>
            <p className={`${textSize} font-medium text-stone-700 mt-1 text-center leading-tight max-w-[60px] truncate`}>
              {member.name || "Nom"}
            </p>
            <p className={`${size === "sm" ? "text-[8px]" : "text-[9px]"} text-emerald-600 leading-tight`}>
              {member.role || "Rôle"}
            </p>
          </div>
        );
      };

      return (
        <div className="w-full h-full bg-gradient-to-b from-emerald-50 via-white to-green-50 p-3 flex flex-col" data-testid="layout-familytree">
          <div className="text-center mb-2">
            <h2 className="text-base font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
            <h3 className="text-xs font-serif text-emerald-600" data-testid="text-page-subtitle">{subtitle}</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {grandparents.length > 0 && parents.length > 0 && (
                <line 
                  x1="50%" y1="22%" 
                  x2="50%" y2="45%" 
                  stroke="#86efac" 
                  strokeWidth="2" 
                  strokeDasharray="4 2"
                />
              )}
              {parents.length > 0 && children.length > 0 && (
                <line 
                  x1="50%" y1="55%" 
                  x2="50%" y2="78%" 
                  stroke="#86efac" 
                  strokeWidth="2" 
                  strokeDasharray="4 2"
                />
              )}
            </svg>
            
            {grandparents.length > 0 && (
              <div className="flex justify-center gap-3 mb-3 relative z-10">
                {grandparents.map(m => renderMember(m, grandparents.length > 2 ? "sm" : "md"))}
              </div>
            )}
            
            {parents.length > 0 && (
              <div className="flex justify-center gap-4 mb-3 relative z-10">
                {parents.map(m => renderMember(m, parents.length > 2 ? "md" : "lg"))}
              </div>
            )}
            
            {children.length > 0 && (
              <div className="flex justify-center gap-3 relative z-10">
                <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl p-3 shadow-inner">
                  <div className="flex justify-center gap-3">
                    {children.map(m => renderMember(m, "lg"))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center mt-1">
            <p className="text-[9px] text-stone-400" data-testid="text-page-date">{date}</p>
          </div>
        </div>
      );
    }

    if (layoutStyle === "journi") {
      if (photoCount === 1) {
        return (
          <div className="w-full h-full bg-[#fafaf8] p-5 flex flex-col" data-testid="layout-journi">
            <div className="flex-1 rounded-3xl overflow-hidden shadow-lg">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-0" />
            </div>
            <div className="pt-4 px-2">
              <p className="text-[10px] text-teal-600 tracking-[0.2em] uppercase font-medium" data-testid="text-page-date">{date}</p>
              <h2 className="text-xl font-serif font-bold text-stone-800 mt-1" data-testid="text-page-title">{title}</h2>
              <p className="text-sm text-stone-500 mt-1 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
            </div>
          </div>
        );
      }
      if (photoCount === 2) {
        return (
          <div className="w-full h-full bg-[#fafaf8] p-4 flex flex-col gap-3" data-testid="layout-journi">
            <div className="flex gap-3 flex-1">
              <div className="flex-[1.2] rounded-3xl overflow-hidden shadow-md">
                <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-0" />
              </div>
              <div className="flex-1 rounded-3xl overflow-hidden shadow-md">
                <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-journi-1" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-teal-600 tracking-widest uppercase" data-testid="text-page-date">{date}</p>
              <h2 className="text-lg font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
              <p className="text-xs text-stone-500 mt-1" data-testid="text-page-description">{description.split('\n')[0]}</p>
            </div>
          </div>
        );
      }
      if (photoCount === 3) {
        return (
          <div className="w-full h-full bg-[#fafaf8] p-4" data-testid="layout-journi">
            <div className="h-full flex flex-col gap-3">
              <div className="flex-[1.5] rounded-3xl overflow-hidden shadow-md">
                <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-0" />
              </div>
              <div className="flex gap-3 flex-1">
                <div className="flex-1 rounded-2xl overflow-hidden shadow-md">
                  <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-journi-1" />
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden shadow-md">
                  <img src={images[2]} className="w-full h-full object-cover" alt="" data-testid="img-journi-2" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-teal-600 tracking-widest uppercase" data-testid="text-page-date">{date}</p>
                  <span className="text-stone-300">•</span>
                  <h2 className="text-sm font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="w-full h-full bg-[#fafaf8] p-3" data-testid="layout-journi">
          <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2 flex-[1.2]">
              <div className="flex-[1.3] rounded-2xl overflow-hidden shadow-md">
                <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-0" />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex-1 rounded-2xl overflow-hidden shadow-md">
                  <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-1" />
                </div>
                <div className="flex-1 rounded-2xl overflow-hidden shadow-md">
                  <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-2" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1 rounded-2xl overflow-hidden shadow-md">
                <img src={images[3] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-journi-3" />
              </div>
              <div className="flex-[1.5] bg-white rounded-2xl p-3 shadow-sm flex flex-col justify-center">
                <p className="text-[9px] text-teal-600 tracking-widest uppercase" data-testid="text-page-date">{date}</p>
                <h2 className="text-base font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (layoutStyle === "mosaic") {
      if (photoCount === 1) {
        return (
          <div className="w-full h-full bg-gradient-to-br from-fuchsia-50 to-pink-50 p-5" data-testid="layout-mosaic">
            <div className="h-full flex flex-col">
              <div className="flex-1 rounded-[2rem] overflow-hidden shadow-xl rotate-[-1deg] hover:rotate-0 transition-transform">
                <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-0" />
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
                <p className="text-xs text-fuchsia-600 mt-1" data-testid="text-page-date">{date}</p>
              </div>
            </div>
          </div>
        );
      }
      if (photoCount === 2) {
        return (
          <div className="w-full h-full bg-gradient-to-br from-fuchsia-50 to-pink-50 p-4" data-testid="layout-mosaic">
            <div className="h-full flex flex-col gap-3">
              <div className="flex-1 flex gap-3">
                <div className="flex-1 rounded-3xl overflow-hidden shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform">
                  <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-0" />
                </div>
                <div className="flex-1 rounded-3xl overflow-hidden shadow-lg rotate-[2deg] hover:rotate-0 transition-transform mt-6">
                  <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-1" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 text-center">
                <h2 className="text-lg font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
                <p className="text-xs text-fuchsia-600" data-testid="text-page-date">{date}</p>
              </div>
            </div>
          </div>
        );
      }
      if (photoCount >= 3 && photoCount <= 4) {
        return (
          <div className="w-full h-full bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-3" data-testid="layout-mosaic">
            <div className="h-full grid grid-cols-6 grid-rows-5 gap-2">
              <div className="col-span-4 row-span-3 rounded-2xl overflow-hidden shadow-lg">
                <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-0" />
              </div>
              <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-md rotate-[1deg]">
                <img src={images[1]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-1" />
              </div>
              <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-md">
                <img src={images[2]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-2" />
              </div>
              <div className="col-span-3 row-span-2 rounded-2xl overflow-hidden shadow-md rotate-[-1deg]">
                {images[3] ? (
                  <img src={images[3]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-3" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-fuchsia-100 to-pink-100 flex items-center justify-center p-3">
                    <div className="text-center">
                      <h2 className="text-base font-serif font-bold text-stone-700" data-testid="text-page-title">{title}</h2>
                      <p className="text-[10px] text-fuchsia-500 mt-1" data-testid="text-page-date">{date}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-3 row-span-2 bg-white rounded-2xl p-3 shadow-sm flex flex-col justify-center">
                <p className="text-[9px] text-fuchsia-600 tracking-widest uppercase" data-testid="text-page-date">{date}</p>
                <h2 className="text-sm font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="w-full h-full bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-3" data-testid="layout-mosaic">
          <div className="h-full grid grid-cols-4 grid-rows-4 gap-2">
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-lg rotate-[-1deg]">
              <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-0" />
            </div>
            <div className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-md">
              <img src={images[1] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-1" />
            </div>
            <div className="col-span-1 row-span-2 rounded-xl overflow-hidden shadow-md rotate-[1deg]">
              <img src={images[2] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-2" />
            </div>
            <div className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-md">
              <img src={images[3] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-3" />
            </div>
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-lg rotate-[1deg]">
              <img src={images[4] || images[0]} className="w-full h-full object-cover" alt="" data-testid="img-mosaic-4" />
            </div>
            <div className="col-span-2 row-span-1 bg-white/90 backdrop-blur rounded-xl p-2 shadow-sm flex flex-col justify-center">
              <p className="text-[9px] text-fuchsia-600 tracking-widest uppercase">{date}</p>
              <h2 className="text-sm font-serif font-bold text-stone-800 leading-tight" data-testid="text-page-title">{title}</h2>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white p-5 flex flex-col" data-testid="layout-default">
        <div className="flex-1 rounded-xl overflow-hidden">
          <img src={images[0]} className="w-full h-full object-cover" alt="" data-testid="img-default-0" />
        </div>
        <div className="pt-4 text-center">
          <p className="text-xs text-stone-400 tracking-widest" data-testid="text-page-date">{date}</p>
          <h2 className="text-xl font-serif font-bold text-stone-800" data-testid="text-page-title">{title}</h2>
          <h3 className="text-lg font-serif text-stone-600" data-testid="text-page-subtitle">{subtitle}</h3>
          <p className="text-sm text-stone-500 mt-2" data-testid="text-page-description">{description.split('\n')[0]}</p>
        </div>
      </div>
    );
  };

  return (
    <div ref={constraintsRef} className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/app">
          <button className="p-2 hover:bg-stone-700 rounded-full transition-colors" data-testid="button-back">
            <ChevronLeft className="text-white" size={24} />
          </button>
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <h1 className="text-white font-serif text-xl font-bold">L'histoire de {babyName}</h1>
      </div>

      {/* Page Counter & Layout Button */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button 
          onClick={() => setShowLayoutPicker(true)}
          className="flex items-center gap-2 text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1.5 rounded-full hover:bg-stone-600/50 transition-colors"
          data-testid="button-change-layout"
        >
          <Layout size={14} />
          <span>{getCurrentLayoutName()}</span>
        </button>
        <span className="text-sm font-medium text-stone-300 bg-stone-700/50 backdrop-blur px-3 py-1.5 rounded-full" data-testid="text-page-counter">
          {currentPageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPreviousPage}
        disabled={currentPageIndex === 0}
        className={`absolute left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          currentPageIndex === 0 
            ? "opacity-30 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur"
        }`}
        data-testid="button-prev-page"
      >
        <ChevronLeft className="text-white" size={28} />
      </button>

      <button
        onClick={goToNextPage}
        disabled={currentPageIndex === pages.length - 1}
        className={`absolute right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          currentPageIndex === pages.length - 1 
            ? "opacity-30 cursor-not-allowed" 
            : "bg-white/10 hover:bg-white/20 backdrop-blur"
        }`}
        data-testid="button-next-page"
      >
        <ChevronRight className="text-white" size={28} />
      </button>

      {/* Book Page */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentPageIndex}-${currentPage.layoutStyle}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg relative"
        >
          <div className="aspect-[3/4] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
            {renderLayout(currentPage)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Action Bar - Draggable */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full p-1.5 shadow-lg cursor-grab active:cursor-grabbing z-30"
        style={{ x: toolbarPosition.x, y: toolbarPosition.y }}
        onDragEnd={(_, info) => {
          setToolbarPosition({ x: info.offset.x, y: info.offset.y });
        }}
      >
        <div className="w-1 h-4 bg-stone-300 rounded-full mx-1" />
        {currentPage.layoutStyle === "family" && (
          <button
            onClick={() => setShowFamilyEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            data-testid="button-edit-family"
          >
            <Users size={16} />
            <span className="text-xs">Famille</span>
          </button>
        )}
        {currentPage.layoutStyle === "familyTree" && (
          <button
            onClick={() => setShowTreeEditor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            data-testid="button-edit-tree"
          >
            <Users size={16} />
            <span className="text-xs">Arbre</span>
          </button>
        )}
        <button
          onClick={() => setEditorMode("text")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-text"
        >
          <Type size={16} />
          <span className="text-xs">Texte</span>
        </button>
        <button
          onClick={() => setEditorMode("photo")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-photo"
        >
          <Camera size={16} />
          <span className="text-xs">Photo</span>
        </button>
        <button
          onClick={() => setEditorMode("video")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
          data-testid="button-add-video"
        >
          <Video size={16} />
          <span className="text-xs">Vidéo</span>
        </button>
        <div className="w-px h-5 bg-stone-200" />
        <button
          onClick={() => setShowInspirationModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white transition-colors"
          data-testid="button-inspiration"
        >
          <Lightbulb size={16} />
          <span className="text-xs">Inspiration</span>
        </button>
        <button
          onClick={addNewPage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white transition-colors"
          data-testid="button-add-new-page"
        >
          <Plus size={16} />
          <span className="text-xs">Page</span>
        </button>
        <div className="w-1 h-4 bg-stone-300 rounded-full mx-1" />
      </motion.div>

      {/* Layout Picker Modal */}
      <AnimatePresence>
        {showLayoutPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLayoutPicker(false)}
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
                  <LayoutTemplate size={20} className="text-primary" />
                  <h3 className="font-bold text-stone-800" data-testid="text-layout-modal-title">Style de collage</h3>
                </div>
                <button 
                  onClick={() => setShowLayoutPicker(false)}
                  className="p-2 hover:bg-stone-100 rounded-full"
                  data-testid="button-close-layout-modal"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {layoutStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateLayoutStyle(style.id as LayoutStyle)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      currentPage.layoutStyle === style.id 
                        ? "border-primary bg-primary/5" 
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                    data-testid={`button-layout-${style.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${currentPage.layoutStyle === style.id ? "text-primary" : "text-stone-700"}`}>
                          {style.name}
                        </p>
                        {style.id === "auto" && (
                          <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">{style.desc}</p>
                    </div>
                    {currentPage.layoutStyle === style.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <p className="text-xs text-stone-500 text-center flex items-center justify-center gap-1">
                  <Wand2 size={12} />
                  Le mode Automatique s'adapte au nombre de photos
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspiration Modal */}
      <AnimatePresence>
        {showInspirationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowInspirationModal(false);
              setSelectedCategory(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-stone-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Lightbulb size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800" data-testid="text-inspiration-modal-title">Inspiration</h3>
                    <p className="text-xs text-stone-500">Choisissez un modèle de page</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowInspirationModal(false);
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-stone-100 rounded-full"
                  data-testid="button-close-inspiration-modal"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              {!selectedCategory ? (
                <div className="p-4 space-y-3 overflow-y-auto">
                  <p className="text-sm text-stone-600 mb-4">Sélectionnez une catégorie pour découvrir des modèles de pages préfabriquées :</p>
                  {inspirationCategories.map((category) => {
                    const CategoryIcon = category.icon;
                    const templateCount = inspirationTemplates.filter(t => t.category === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id as InspirationCategory)}
                        className="w-full p-4 rounded-xl border-2 border-stone-200 hover:border-stone-300 transition-all text-left flex items-center gap-4 group"
                        data-testid={`button-category-${category.id}`}
                      >
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                          <CategoryIcon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-stone-700">{category.name}</p>
                          <p className="text-xs text-stone-500">{templateCount} modèle{templateCount > 1 ? 's' : ''} disponible{templateCount > 1 ? 's' : ''}</p>
                        </div>
                        <ChevronRight size={20} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors shrink-0 border-b border-stone-100"
                    data-testid="button-back-categories"
                  >
                    <ChevronLeft size={16} />
                    <span>Retour aux catégories</span>
                  </button>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {inspirationTemplates
                      .filter(t => t.category === selectedCategory)
                      .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => addInspirationPage(template)}
                          className="w-full p-4 rounded-xl border-2 border-stone-200 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4 group"
                          data-testid={`button-template-${template.id}`}
                        >
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-lg text-2xl group-hover:scale-105 transition-transform`}>
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-stone-700 group-hover:text-primary transition-colors">{template.title}</p>
                              <p className="text-sm text-stone-500">{template.subtitle}</p>
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-2">{template.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                                {layoutStyles.find(s => s.id === template.layoutStyle)?.name || template.layoutStyle}
                              </span>
                            </div>
                          </div>
                          <Plus size={20} className="text-stone-400 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      ))}
                  </div>
                </>
              )}

              <div className="p-4 border-t border-stone-100 bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
                <p className="text-xs text-stone-600 text-center flex items-center justify-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  Les pages sont entièrement personnalisables après ajout
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {editorMode === "qrcode" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-qr-modal-title">Générer un QR Code</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-qr-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  URL de la vidéo
                </label>
                <input
                  type="text"
                  value={selectedVideoUrl}
                  onChange={(e) => setSelectedVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                  data-testid="input-qr-url"
                />
              </div>

              {selectedVideoUrl && (
                <div className="flex justify-center mb-6 p-4 bg-stone-50 rounded-lg">
                  <img 
                    src={generateQRCodeDataUrl(selectedVideoUrl)} 
                    alt="QR Code preview" 
                    className="w-40 h-40"
                    data-testid="img-qr-preview"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={closeEditor} variant="outline" className="flex-1" data-testid="button-cancel-qr">
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (selectedVideoUrl) {
                      setSelectedVideoUrl("");
                      closeEditor();
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  disabled={!selectedVideoUrl}
                  data-testid="button-add-qr"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Editor Modal */}
      <AnimatePresence>
        {editorMode === "text" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-editor-modal-title">Modifier le texte</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-text-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={currentPage.title}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].title = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    data-testid="input-page-title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Sous-titre</label>
                  <input
                    type="text"
                    value={currentPage.subtitle}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].subtitle = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    data-testid="input-page-subtitle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Date</label>
                  <input
                    type="text"
                    value={currentPage.date}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].date = e.target.value;
                      setPages(newPages);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    placeholder="JJ / MM / AAAA"
                    data-testid="input-page-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Description</label>
                  <textarea
                    value={currentPage.description}
                    onChange={(e) => {
                      const newPages = [...pages];
                      newPages[currentPageIndex].description = e.target.value;
                      setPages(newPages);
                    }}
                    rows={4}
                    className="w-full p-3 border border-stone-200 rounded-lg focus:outline-none focus:border-primary text-sm resize-none"
                    placeholder="Racontez votre histoire..."
                    data-testid="input-page-description"
                  />
                </div>
              </div>

              <Button onClick={closeEditor} className="w-full" data-testid="button-save-text">
                Enregistrer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {editorMode === "photo" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-photo-modal-title">Gérer les photos</h3>
                <button 
                  onClick={closeEditor} 
                  className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
                  data-testid="button-close-photo-modal"
                >
                  <X size={24} className="text-stone-700" />
                </button>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-700">Photos actuelles</span>
                  <span className="text-xs text-primary font-medium">{currentPage.images.length} photo(s)</span>
                </div>
                <p className="text-xs text-stone-500">
                  {currentPage.layoutStyle === "auto" 
                    ? "La mise en page s'adapte automatiquement au nombre de photos"
                    : `Style actuel: ${getCurrentLayoutName()}`}
                </p>
              </div>

              {currentPage.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {currentPage.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group" data-testid={`img-thumbnail-${idx}`}>
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={() => {
                          const newPages = [...pages];
                          newPages[currentPageIndex].images = currentPage.images.filter((_, i) => i !== idx);
                          setPages(newPages);
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-camera"
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                data-testid="input-gallery"
              />

              {isUploading && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Ajout en cours...</span>
                </div>
              )}

              <Button onClick={closeEditor} className="w-full" data-testid="button-finish-photo">
                Terminer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Upload Modal */}
      <AnimatePresence>
        {editorMode === "video" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900" data-testid="text-video-modal-title">Ajouter une vidéo</h3>
                <button onClick={closeEditor} className="p-2 hover:bg-stone-100 rounded-full" data-testid="button-close-video-modal">
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => videoCameraRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors"
                  data-testid="button-record-video"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <Video size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Enregistrer</p>
                    <p className="text-xs text-stone-400 mt-1">Ouvrir la caméra</p>
                  </div>
                </button>

                <button
                  onClick={() => videoGalleryRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-stone-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  data-testid="button-video-gallery"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg">
                    <ImageIcon size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-stone-700">Galerie</p>
                    <p className="text-xs text-stone-400 mt-1">Choisir une vidéo</p>
                  </div>
                </button>
              </div>

              <input
                ref={videoCameraRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                data-testid="input-video-camera"
              />

              <input
                ref={videoGalleryRef}
                type="file"
                accept="video/*"
                className="hidden"
                data-testid="input-video-gallery"
              />

              <p className="text-xs text-stone-500 text-center mb-4" data-testid="text-video-info">
                La vidéo sera convertie en QR code pour l'impression du livre
              </p>

              <Button onClick={closeEditor} className="w-full" data-testid="button-finish-video">
                Terminer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Editor Modal */}
      <AnimatePresence>
        {showFamilyEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFamilyEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-rose-500" />
                  <h3 className="text-xl font-bold text-stone-900" data-testid="text-family-modal-title">Membres de la famille</h3>
                </div>
                <button 
                  onClick={() => setShowFamilyEditor(false)} 
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                  data-testid="button-close-family-modal"
                >
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {(currentPage.familyMembers || []).map((member, idx) => (
                  <div 
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl"
                    data-testid={`family-member-row-${idx}`}
                  >
                    <div 
                      className="w-14 h-14 rounded-lg overflow-hidden bg-rose-100 flex-shrink-0 cursor-pointer relative group"
                      onClick={() => {
                        setEditingMemberIndex(idx);
                        familyPhotoInputRef.current?.click();
                      }}
                    >
                      {member.photo ? (
                        <>
                          <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={16} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus size={20} className="text-rose-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const newPages = [...pages];
                          if (newPages[currentPageIndex].familyMembers) {
                            newPages[currentPageIndex].familyMembers![idx].name = e.target.value;
                            setPages(newPages);
                          }
                        }}
                        placeholder="Nom"
                        className="w-full text-sm font-medium text-stone-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 mb-1"
                        data-testid={`input-family-name-${idx}`}
                      />
                      <input
                        type="text"
                        value={member.description}
                        onChange={(e) => {
                          const newPages = [...pages];
                          if (newPages[currentPageIndex].familyMembers) {
                            newPages[currentPageIndex].familyMembers![idx].description = e.target.value;
                            setPages(newPages);
                          }
                        }}
                        placeholder="Description"
                        className="w-full text-xs text-stone-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                        data-testid={`input-family-desc-${idx}`}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newPages = [...pages];
                        if (newPages[currentPageIndex].familyMembers) {
                          newPages[currentPageIndex].familyMembers = newPages[currentPageIndex].familyMembers!.filter((_, i) => i !== idx);
                          setPages(newPages);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`button-remove-family-${idx}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {(currentPage.familyMembers?.length || 0) < 4 && (
                <button
                  onClick={() => {
                    const newPages = [...pages];
                    const members = newPages[currentPageIndex].familyMembers || [];
                    members.push({
                      id: Date.now(),
                      photo: "",
                      name: "",
                      description: ""
                    });
                    newPages[currentPageIndex].familyMembers = members;
                    setPages(newPages);
                  }}
                  className="w-full p-4 border-2 border-dashed border-rose-200 rounded-xl text-rose-500 hover:border-rose-400 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                  data-testid="button-add-family-member"
                >
                  <Plus size={18} />
                  <span className="text-sm font-medium">Ajouter un membre ({(currentPage.familyMembers?.length || 0)}/4)</span>
                </button>
              )}

              <input
                ref={familyPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0 || editingMemberIndex === null) return;
                  
                  const file = files[0];
                  const dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                  });
                  
                  const newPages = [...pages];
                  if (newPages[currentPageIndex].familyMembers) {
                    newPages[currentPageIndex].familyMembers![editingMemberIndex].photo = dataUrl;
                    setPages(newPages);
                  }
                  setEditingMemberIndex(null);
                  e.target.value = "";
                }}
                className="hidden"
                data-testid="input-family-photo"
              />

              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 text-center mb-3">
                  Ajoutez de 1 à 4 membres de votre famille
                </p>
                <Button onClick={() => setShowFamilyEditor(false)} className="w-full" data-testid="button-save-family">
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree Editor Modal */}
      <AnimatePresence>
        {showTreeEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTreeEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌳</span>
                  <h3 className="text-xl font-bold text-stone-900" data-testid="text-tree-modal-title">Arbre généalogique</h3>
                </div>
                <button 
                  onClick={() => setShowTreeEditor(false)} 
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                  data-testid="button-close-tree-modal"
                >
                  <X size={20} className="text-stone-600" />
                </button>
              </div>

              {/* Level selector tabs */}
              <div className="flex gap-1 mb-4 bg-stone-100 p-1 rounded-xl">
                {[
                  { level: "grandparents" as TreeLevel, label: "Grands-parents", icon: "👴" },
                  { level: "parents" as TreeLevel, label: "Parents", icon: "👨‍👩‍👧" },
                  { level: "child" as TreeLevel, label: "Enfant", icon: "👶" },
                ].map(({ level, label, icon }) => (
                  <button
                    key={level}
                    onClick={() => setSelectedTreeLevel(level)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedTreeLevel === level 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                    data-testid={`button-tree-level-${level}`}
                  >
                    <span>{icon}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Members in selected level */}
              <div className="space-y-3 mb-4">
                {(currentPage.treeMembers || [])
                  .filter(m => m.level === selectedTreeLevel)
                  .map((member, idx) => {
                    const globalIdx = (currentPage.treeMembers || []).findIndex(m => m.id === member.id);
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl"
                        data-testid={`tree-member-row-${idx}`}
                      >
                        <div 
                          className="w-14 h-14 rounded-full overflow-hidden bg-emerald-100 flex-shrink-0 cursor-pointer relative group"
                          onClick={() => {
                            setEditingTreeMemberIndex(globalIdx);
                            treePhotoInputRef.current?.click();
                          }}
                        >
                          {member.photo ? (
                            <>
                              <img src={member.photo} className="w-full h-full object-cover" alt={member.name} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera size={16} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImagePlus size={20} className="text-emerald-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              const newPages = [...pages];
                              if (newPages[currentPageIndex].treeMembers) {
                                newPages[currentPageIndex].treeMembers![globalIdx].name = e.target.value;
                                setPages(newPages);
                              }
                            }}
                            placeholder="Nom"
                            className="w-full text-sm font-medium text-stone-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 mb-1"
                            data-testid={`input-tree-name-${idx}`}
                          />
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const newPages = [...pages];
                              if (newPages[currentPageIndex].treeMembers) {
                                newPages[currentPageIndex].treeMembers![globalIdx].role = e.target.value;
                                setPages(newPages);
                              }
                            }}
                            placeholder={selectedTreeLevel === "grandparents" ? "Ex: Papi, Mamie" : selectedTreeLevel === "parents" ? "Ex: Papa, Maman" : "Ex: Bébé"}
                            className="w-full text-xs text-stone-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                            data-testid={`input-tree-role-${idx}`}
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newPages = [...pages];
                            if (newPages[currentPageIndex].treeMembers) {
                              newPages[currentPageIndex].treeMembers = newPages[currentPageIndex].treeMembers!.filter((_, i) => i !== globalIdx);
                              setPages(newPages);
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          data-testid={`button-remove-tree-${idx}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Add member button */}
              <button
                onClick={() => {
                  const newPages = [...pages];
                  const members = newPages[currentPageIndex].treeMembers || [];
                  members.push({
                    id: Date.now(),
                    level: selectedTreeLevel,
                    photo: "",
                    name: "",
                    role: ""
                  });
                  newPages[currentPageIndex].treeMembers = members;
                  setPages(newPages);
                }}
                className="w-full p-4 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                data-testid="button-add-tree-member"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">
                  Ajouter {selectedTreeLevel === "grandparents" ? "un grand-parent" : selectedTreeLevel === "parents" ? "un parent" : "un enfant"}
                </span>
              </button>

              <input
                ref={treePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0 || editingTreeMemberIndex === null) return;
                  
                  const file = files[0];
                  const dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                  });
                  
                  const newPages = [...pages];
                  if (newPages[currentPageIndex].treeMembers) {
                    newPages[currentPageIndex].treeMembers![editingTreeMemberIndex].photo = dataUrl;
                    setPages(newPages);
                  }
                  setEditingTreeMemberIndex(null);
                  e.target.value = "";
                }}
                className="hidden"
                data-testid="input-tree-photo"
              />

              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-3">
                  <span>📊</span>
                  <span>
                    {(currentPage.treeMembers || []).filter(m => m.level === "grandparents").length} grands-parents • 
                    {(currentPage.treeMembers || []).filter(m => m.level === "parents").length} parents • 
                    {(currentPage.treeMembers || []).filter(m => m.level === "child").length} enfants
                  </span>
                </div>
                <Button onClick={() => setShowTreeEditor(false)} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="button-save-tree">
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
