import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Upload, Grid3x3, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type CreateStep = "info" | "template" | "photos" | "edit" | "preview";

export default function CreateAlbum() {
  const [step, setStep] = useState<CreateStep>("info");
  const [childName, setChildName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const templates = [
    {
      id: "modern",
      name: "Moderne",
      desc: "Design épuré et minimaliste",
      preview: "https://images.unsplash.com/photo-1544126566-475d8528f69f?q=80&w=200&auto=format&fit=crop",
      layout: "clean"
    },
    {
      id: "classic",
      name: "Classique",
      desc: "Intemporel et élégant",
      preview: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=200&auto=format&fit=crop",
      layout: "classic"
    },
    {
      id: "playful",
      name: "Ludique",
      desc: "Coloré et amusant",
      preview: "https://images.unsplash.com/photo-1503454537688-e47546fe5d37?q=80&w=200&auto=format&fit=crop",
      layout: "playful"
    },
    {
      id: "story",
      name: "Récit",
      desc: "Narratif avec texte",
      preview: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=200&auto=format&fit=crop",
      layout: "story"
    }
  ];

  const handleContinue = () => {
    if (step === "info" && childName) setStep("template");
    else if (step === "template") setStep("photos");
    else if (step === "photos" && selectedPhotos.length > 0) setStep("edit");
    else if (step === "edit") setStep("preview");
  };

  const handleBack = () => {
    const steps: CreateStep[] = ["info", "template", "photos", "edit", "preview"];
    const currentIdx = steps.indexOf(step);
    if (currentIdx > 0) setStep(steps[currentIdx - 1]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-50 to-secondary/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-stone-100">
        <Link href="/app">
          <button className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <ChevronLeft className="text-stone-700" />
          </button>
        </Link>
        <h1 className="text-xl font-serif font-bold text-stone-900">Créer un nouveau livre</h1>
        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex gap-2">
          {["info", "template", "photos", "edit", "preview"].map((s, idx) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                ["info", "template", "photos", "edit", "preview"].indexOf(step) >= idx
                  ? "bg-primary"
                  : "bg-stone-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 lg:px-6 pb-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Child Info */}
          {step === "info" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto space-y-8 mt-12"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Commençons par les bases
                </h2>
                <p className="text-stone-600">Quel est le nom de votre enfant?</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Prénom de l'enfant"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-primary focus:outline-none text-lg"
                />
                <p className="text-xs text-stone-500">
                  Ce nom apparaîtra sur la couverture de votre livre
                </p>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!childName}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg"
              >
                Continuer
              </Button>
            </motion.div>
          )}

          {/* Step 2: Template Selection */}
          {step === "template" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8 mt-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Choisir un style
                </h2>
                <p className="text-stone-600">Quel style correspond à votre vision?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                      selectedTemplate === template.id
                        ? "ring-2 ring-primary shadow-lg scale-105"
                        : "ring-1 ring-stone-200 hover:shadow-md"
                    }`}
                  >
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-bold text-sm">{template.name}</h3>
                      <p className="text-xs opacity-80">{template.desc}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg"
                >
                  Continuer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Photo Selection */}
          {step === "photos" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8 mt-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Ajouter des photos
                </h2>
                <p className="text-stone-600">
                  Sélectionnez au minimum 5 photos pour commencer
                </p>
              </div>

              {/* Mock Photo Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div
                    key={i}
                    onClick={() => {
                      if (selectedPhotos.includes(`photo-${i}`)) {
                        setSelectedPhotos(selectedPhotos.filter((p) => p !== `photo-${i}`));
                      } else {
                        setSelectedPhotos([...selectedPhotos, `photo-${i}`]);
                      }
                    }}
                    className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                      selectedPhotos.includes(`photo-${i}`)
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-stone-200 hover:ring-stone-300"
                    }`}
                  >
                    <img
                      src={`https://images.unsplash.com/photo-155${i}?w=300&h=300&auto=format&fit=crop`}
                      alt={`Photo ${i}`}
                      className="w-full aspect-square object-cover"
                    />
                    {selectedPhotos.includes(`photo-${i}`) && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Check size={20} className="text-white" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Add More Button */}
                <button className="border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-stone-400" />
                    <span className="text-xs text-stone-500">Ajouter</span>
                  </div>
                </button>
              </div>

              <p className="text-sm text-stone-600 text-center">
                {selectedPhotos.length} photo{selectedPhotos.length > 1 ? "s" : ""} sélectionnée
                {selectedPhotos.length > 1 ? "s" : ""}
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={selectedPhotos.length < 5}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg disabled:opacity-50"
                >
                  Continuer ({selectedPhotos.length}/5)
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Edit */}
          {step === "edit" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8 mt-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Organiser votre livre
                </h2>
                <p className="text-stone-600">
                  L'IA arrange automatiquement vos photos. Vous pouvez les réorganiser.
                </p>
              </div>

              {/* Mock Layout Preview */}
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg">
                  <Sparkles size={18} className="text-primary" />
                  <p className="text-sm text-stone-700">
                    Arrangement automatique appliqué ✓
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedPhotos.map((photo, idx) => (
                    <div
                      key={photo}
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200"
                    >
                      <Grid3x3 size={18} className="text-stone-400 cursor-move" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900">Page {idx + 1}</p>
                        <p className="text-xs text-stone-500">1 photo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-primary/5 rounded-lg p-4">
                <p className="text-sm font-medium text-stone-900">Personnalisation:</p>
                <ul className="space-y-2 text-xs text-stone-600">
                  <li>✓ Ajouter du texte à chaque page</li>
                  <li>✓ Modifier l'ordre des photos</li>
                  <li>✓ Changer la mise en page</li>
                  <li>✓ Ajouter une couverture personnalisée</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-stone-200"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleContinue}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 rounded-lg"
                >
                  Aperçu du livre
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Preview */}
          {step === "preview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8 mt-8"
            >
              <div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                  Aperçu de "{childName}"
                </h2>
                <p className="text-stone-600">
                  Votre livre est prêt à être personnalisé et imprimé!
                </p>
              </div>

              {/* Book Preview */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-[4/5] bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl font-serif font-bold text-stone-800 mb-2">
                      {childName}
                    </p>
                    <p className="text-stone-600">{selectedPhotos.length} pages créées</p>
                    <p className="text-sm text-stone-500 mt-4">Style: {templates.find(t => t.id === selectedTemplate)?.name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-2xl font-bold text-primary">{selectedPhotos.length}</p>
                  <p className="text-xs text-stone-600 mt-1">Photos</p>
                </div>
                <div className="bg-secondary/5 rounded-lg p-4">
                  <p className="text-2xl font-bold text-secondary-foreground">{selectedPhotos.length + 2}</p>
                  <p className="text-xs text-stone-600 mt-1">Pages totales</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/app">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-lg">
                    Continuer l'édition
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-12 rounded-lg border-stone-200">
                  Options d'impression
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
