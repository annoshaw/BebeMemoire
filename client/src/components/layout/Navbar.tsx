import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoMemo from "@/assets/logo-memo.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [location] = useLocation();

  const toggleLang = () => setLang(lang === "fr" ? "en" : "fr");

  const navLinks = [
    { name: lang === "fr" ? "Fonctionnalités" : "Features", href: "#features" },
    { name: lang === "fr" ? "Comment ça marche" : "How it works", href: "#how-it-works" },
    { name: lang === "fr" ? "Livre Imprimé" : "Printed Book", href: "#print" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="font-serif text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <img src={logoMemo} alt="Mémo" className="h-12 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-stone-600 hover:text-primary transition-colors font-medium text-sm"
              >
                {link.name}
              </a>
            ))}
            
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
            >
              <Globe size={16} />
              <span>{lang.toUpperCase()}</span>
            </button>

            <Link href="/register" asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                {lang === "fr" ? "Commencer" : "Get Started"}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
             <button 
              onClick={toggleLang}
              className="flex items-center gap-1 text-stone-500 text-sm font-medium"
            >
              <Globe size={16} />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-600 hover:text-stone-900 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-stone-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-stone-600 hover:text-primary hover:bg-stone-50 rounded-md font-medium"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4">
                <Link href="/app" asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full">
                    {lang === "fr" ? "Commencer mon livre" : "Start my book"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}