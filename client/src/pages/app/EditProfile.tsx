import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Save, User, Mail, Phone, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    country: ""
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFormData({
        name: localStorage.getItem("userName") || "",
        email: localStorage.getItem("userEmail") || "",
        phone: localStorage.getItem("userPhone") || "",
        address: localStorage.getItem("userAddress") || "",
        gender: localStorage.getItem("userGender") || "",
        country: localStorage.getItem("userCountry") || ""
      });
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    localStorage.setItem("userName", formData.name);
    localStorage.setItem("userEmail", formData.email);
    localStorage.setItem("userPhone", formData.phone);
    localStorage.setItem("userAddress", formData.address);
    localStorage.setItem("userGender", formData.gender);
    localStorage.setItem("userCountry", formData.country);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        setLocation("/app");
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-stone-100 p-4 flex items-center justify-between">
          <Link href="/app">
            <button className="p-2 hover:bg-stone-100 rounded-full -ml-2" data-testid="button-back-profile">
              <ChevronLeft className="text-stone-800" />
            </button>
          </Link>
          <h1 className="text-lg font-serif font-bold text-stone-800">Modifier mon profil</h1>
          <div className="w-10" />
        </div>

        <div className="p-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={40} className="text-primary" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <User size={14} className="text-stone-400" />
                Nom complet
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom complet"
                className="h-12"
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <Mail size={14} className="text-stone-400" />
                Adresse email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.com"
                className="h-12"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <Phone size={14} className="text-stone-400" />
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (514) 555-1234"
                className="h-12"
                data-testid="input-phone"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
                <MapPin size={14} className="text-stone-400" />
                Adresse
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Votre adresse complète"
                className="h-12"
                data-testid="input-address"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Genre</label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className="h-12" data-testid="select-gender">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Femme">Femme</SelectItem>
                  <SelectItem value="Homme">Homme</SelectItem>
                  <SelectItem value="Non-binaire">Non-binaire</SelectItem>
                  <SelectItem value="Non spécifié">Préfère ne pas dire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Pays</label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className="h-12" data-testid="select-country">
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="canada">Canada</SelectItem>
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="belgium">Belgique</SelectItem>
                  <SelectItem value="switzerland">Suisse</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <Button
              onClick={handleSave}
              disabled={isSaving || showSuccess}
              className="w-full h-12 bg-primary hover:bg-primary/90"
              data-testid="button-save-profile"
            >
              {showSuccess ? (
                <>
                  <Check size={18} className="mr-2" />
                  Sauvegardé!
                </>
              ) : isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Sauvegarder les modifications
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
                Vos modifications ont été sauvegardées!
              </p>
              <p className="text-xs text-green-600 mt-1">
                Redirection en cours...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
