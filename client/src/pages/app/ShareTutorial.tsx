import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Share2, 
  Mail, 
  MousePointer, 
  CheckCircle, 
  Users, 
  Edit2, 
  Eye,
  ArrowRight,
  BookOpen,
  Clock,
  ArrowLeft
} from "lucide-react";

export default function ShareTutorial() {
  const steps = [
    {
      number: 1,
      title: "Trouvez le bouton Partager",
      description: "Sur la carte de votre livre, cliquez sur l'icône de partage (deux flèches) située à côté de la corbeille.",
      icon: Share2,
      color: "bg-blue-100 text-blue-600"
    },
    {
      number: 2,
      title: "Entrez l'adresse email",
      description: "Dans la fenêtre qui s'ouvre, saisissez l'adresse email de la personne que vous souhaitez inviter.",
      icon: Mail,
      color: "bg-purple-100 text-purple-600"
    },
    {
      number: 3,
      title: "Choisissez le rôle",
      description: "Sélectionnez le niveau d'accès : Collaborateur (peut modifier) ou Observateur (lecture seule).",
      icon: Users,
      color: "bg-green-100 text-green-600"
    },
    {
      number: 4,
      title: "Envoyez l'invitation",
      description: "Cliquez sur 'Envoyer l'invitation'. La personne recevra un email avec un lien pour accepter.",
      icon: MousePointer,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const receiverSteps = [
    {
      number: 1,
      title: "Ouvrir l'email",
      description: "Vous recevrez un email intitulé 'Invitation à collaborer sur un livre' avec les détails de l'invitation.",
      icon: Mail,
      color: "bg-blue-100 text-blue-600"
    },
    {
      number: 2,
      title: "Cliquer sur le bouton",
      description: "Cliquez sur le bouton 'Accepter l'invitation' dans l'email pour ouvrir la page d'acceptation.",
      icon: MousePointer,
      color: "bg-purple-100 text-purple-600"
    },
    {
      number: 3,
      title: "Se connecter",
      description: "Si vous n'êtes pas connecté, connectez-vous avec la même adresse email que celle de l'invitation.",
      icon: Users,
      color: "bg-green-100 text-green-600"
    },
    {
      number: 4,
      title: "Accepter l'invitation",
      description: "Vérifiez les détails et cliquez sur 'Accepter l'invitation'. Le livre apparaîtra dans votre liste.",
      icon: CheckCircle,
      color: "bg-orange-100 text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/app">
          <Button variant="ghost" className="mb-6" data-testid="button-back-to-app">
            <ArrowLeft size={16} className="mr-2" />
            Retour à l'application
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            Comment partager votre livre
          </h1>
          <p className="text-stone-500">
            Invitez famille et amis à consulter ou modifier votre livre de souvenirs
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">Pour envoyer une invitation</h2>
              <p className="text-sm text-stone-500">Suivez ces 4 étapes simples</p>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Étape {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-stone-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Mail size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">Pour accepter une invitation</h2>
              <p className="text-sm text-stone-500">Ce que verra la personne invitée</p>
            </div>
          </div>

          <div className="space-y-4">
            {receiverSteps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-start gap-4 p-4 bg-stone-50 rounded-xl"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                      Étape {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-stone-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-8"
        >
          <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Les deux types d'accès
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Edit2 size={16} className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-stone-800">Collaborateur</h4>
              </div>
              <ul className="text-sm text-stone-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Modifier le contenu du livre
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Ajouter des photos et souvenirs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Passer des commandes d'impression
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye size={16} className="text-purple-600" />
                </div>
                <h4 className="font-semibold text-stone-800">Observateur</h4>
              </div>
              <ul className="text-sm text-stone-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Consulter le livre
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  Voir les photos et souvenirs
                </li>
                <li className="flex items-center gap-2 text-stone-400">
                  <span className="w-3.5 h-0.5 bg-stone-300 rounded"></span>
                  Lecture seule (pas de modification)
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <Clock size={24} className="text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Bon à savoir</h3>
              <ul className="text-sm text-amber-700 space-y-2">
                <li>L'invitation expire après <strong>7 jours</strong> si elle n'est pas acceptée.</li>
                <li>La personne invitée doit utiliser la <strong>même adresse email</strong> pour accepter.</li>
                <li>Vous pouvez inviter plusieurs personnes sur le même livre.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/app">
            <Button size="lg" className="gap-2" data-testid="button-start-sharing">
              <Share2 size={18} />
              Commencer à partager
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
