import { Heart, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import logoMemo from "@/assets/logo-memo.png";
import { useMemoStore } from "@/store/useMemoStore";

const translations = {
  fr: {
    tagline: "Capturer les moments les plus précieux de la vie, un souvenir à la fois. Conçu pour les familles modernes au Canada et ailleurs.",
    platform: "Plateforme",
    howItWorks: "Comment ça marche",
    pricing: "Tarification",
    downloadApp: "Télécharger l'app",
    giftCards: "Cartes-cadeaux",
    company: "Entreprise",
    aboutUs: "À propos",
    careers: "Carrières",
    contact: "Contact",
    privacyPolicy: "Politique de confidentialité",
    connect: "Nous suivre",
    madeWith: "Fait avec",
    location: "au Saguenay-Lac-St-Jean.",
    allRights: "Tous droits réservés.",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
  },
  en: {
    tagline: "Capturing life's most precious moments, one memory at a time. Designed for modern families in Canada and beyond.",
    platform: "Platform",
    howItWorks: "How it works",
    pricing: "Pricing",
    downloadApp: "Download App",
    giftCards: "Gift Cards",
    company: "Company",
    aboutUs: "About Us",
    careers: "Careers",
    contact: "Contact",
    privacyPolicy: "Privacy Policy",
    connect: "Connect",
    madeWith: "Made with",
    location: "in Saguenay-Lac-St-Jean.",
    allRights: "All rights reserved.",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
  },
};

export default function Footer() {
  const { language } = useMemoStore();
  const t = translations[language];

  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <img src={logoMemo} alt="Mémo" className="w-8 h-8 object-contain" />
              Mémo
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              {t.tagline}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t.platform}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">{t.howItWorks}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t.pricing}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.downloadApp}</a></li>
              <li><a href="/certificat-cadeau" className="hover:text-white transition-colors">{t.giftCards}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.company}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">{t.aboutUs}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.careers}</a></li>
              <li><a href="mailto:memo.app.25@hotmail.com" className="hover:text-white transition-colors">{t.contact}</a></li>
              <li><a href="#" className="hover:text-white transition-colors">{t.privacyPolicy}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.connect}</h4>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/memo.app.25" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            </div>
            <a href="mailto:memo.app.25@hotmail.com" className="mt-4 flex items-center gap-2 text-sm hover:text-white transition-colors">
              <Mail size={16} />
              memo.app.25@hotmail.com
            </a>
            <p className="mt-4 text-xs">
              {t.madeWith} <Heart size={12} className="inline text-red-500" /> {t.location}
            </p>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2025 Mémo Inc. {t.allRights}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">{t.terms}</a>
            <a href="#" className="hover:text-white">{t.privacy}</a>
            <a href="#" className="hover:text-white">{t.cookies}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
