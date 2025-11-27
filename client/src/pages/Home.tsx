import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Heart, Video, Printer, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "wouter";

// Import generated assets
import heroImage from "@assets/generated_images/happy_parents_with_baby_looking_at_tablet.png";
import appImage from "@assets/generated_images/mobile_app_interface_for_baby_book.png";
import printImage from "@assets/generated_images/high_quality_printed_baby_book.png";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="space-y-8"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Disponible au Canada & Europe
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-serif font-bold text-stone-900 leading-[1.1]">
                Le livre de naissance <br/>
                <span className="text-primary italic">réinventé.</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-stone-600 leading-relaxed max-w-lg">
                Remplissez l'histoire de votre enfant au moment qui vous convient directement depuis votre appareil mobile ou votre talette. Insérez des photos et des vidéos et laissez-vous guider par notre modèle de livre pour y ajouter ce qui convient à VOTRE famille. L'impression du livre avec vos photos et votre texte donnera accès aux vidéos par code QR.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/20">
                    Commencer l'histoire
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg border-stone-200 hover:bg-stone-50 text-stone-600">
                  <Play size={18} className="mr-2 fill-stone-600" />
                  Voir la démo
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm text-stone-500 pt-4">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-xs font-bold overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <p>Rejoignez +10,000 parents modernes</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={heroImage} 
                  alt="Famille regardant le livre numérique" 
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
              </div>
              
              {/* Floating UI Elements */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-stone-100 max-w-[200px]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground">
                    <Heart size={16} className="fill-current" />
                  </div>
                  <span className="text-xs font-bold text-stone-800">Premier sourire</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4"></div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 text-right">Ajouté il y a 2 min</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-serif font-bold text-stone-900 mb-6">Conçu pour la vraie vie de parent</h2>
            <p className="text-lg text-stone-600">
              Oubliez la culpabilité du livre vide. Memoria s'adapte à votre rythme, capture vos vidéos, et ne garde que le meilleur.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="w-8 h-8 text-primary" />,
                title: "Toujours accessible",
                desc: "Remplissez-le pendant la tétée, dans le bus, ou en attendant le pédiatre. Votre livre est toujours dans votre poche."
              },
              {
                icon: <Video className="w-8 h-8 text-secondary-foreground" />,
                title: "Photos & Vidéos",
                desc: "Une photo fige l'instant, une vidéo capture l'émotion. Intégrez vos vidéos marquantes via des QR codes élégants."
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-stone-700" />,
                title: "Zéro gaspillage",
                desc: "Fini les pages 'Première dent' qui restent vides. Vous choisissez quelles pages imprimer. Personnalisation totale."
              },
              {
                icon: <Heart className="w-8 h-8 text-red-400" />,
                title: "Inclusivité Totale",
                desc: "Adapté à toutes les familles : monoparentales, homoparentales, adoptions, naissances multiples. C'est votre histoire."
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-primary" />,
                title: "Notifications Intelligentes",
                desc: "Recevez des suggestions personnalisées : 'Vous êtes à 6 mois, une photo du ventre ?' ou 'Léo a 1 an aujourd'hui !'"
              },
              {
                icon: <Printer className="w-8 h-8 text-stone-800" />,
                title: "Impression Premium",
                desc: "Papier mat certifié FSC, couverture rigide en toile. Une qualité d'archivage pour durer toute une vie."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-6 p-3 bg-stone-50 rounded-xl w-fit">{feature.icon}</div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4">Une formule pour chaque famille</h2>
            <p className="text-lg text-stone-600">Commencez gratuitement, évoluez selon vos souvenirs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Découverte",
                price: "Gratuit",
                desc: "Parfait pour commencer",
                features: ["Accès à l'application", "1 Go de stockage photos", "Création du livre", "Chronologie automatique"],
                cta: "Commencer",
                highlight: false
              },
              {
                name: "Premium",
                price: "1.99 $ / mois",
                desc: "L'expérience complète",
                features: ["QR Codes vidéo inclus", "Photos illimitées", "2 Go de stockage vidéos", "Support prioritaire"],
                cta: "Essayer Premium",
                highlight: true
              },
              {
                name: "Platine",
                price: "4.99 $ / mois",
                desc: "Pour les vidéastes",
                features: ["Tout du Premium", "5 Go de stockage vidéos", "15% de rabais sur l'impression", "Design exclusifs"],
                cta: "Choisir Platine",
                highlight: false
              }
            ].map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-8 ${plan.highlight ? 'bg-stone-900 text-white shadow-xl scale-105 z-10' : 'bg-stone-50 text-stone-900 border border-stone-100'}`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    Recommandé
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-serif font-bold mb-2">{plan.price}</div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-stone-400' : 'text-stone-500'}`}>{plan.desc}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className={plan.highlight ? 'text-primary' : 'text-stone-400'} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-full py-6 ${plan.highlight ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Showcase Section */}
      <section id="how-it-works" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1 flex justify-center"
            >
              <div className="relative w-[300px] h-[600px] bg-stone-900 rounded-[3rem] border-[8px] border-stone-900 shadow-2xl overflow-hidden">
                <img src={appImage} alt="App Interface" className="w-full h-full object-cover" />
              </div>
              {/* Decorative circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -z-10"></div>
            </motion.div>
            
            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-4xl font-serif font-bold text-stone-900">
                Simple comme un jeu d'enfant.
              </h2>
              
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: "Capturez l'instant",
                    desc: "Une photo, une note vocale ou une anecdote rapide. Enregistrez le moment dès qu'il arrive."
                  },
                  {
                    step: "02",
                    title: "Organisez sans effort",
                    desc: "L'application trie chronologiquement vos souvenirs. Réorganisez, modifiez et embellissez quand vous avez le temps."
                  },
                  {
                    step: "03",
                    title: "Partagez ou Imprimez",
                    desc: "Partagez une version numérique avec la famille éloignée, ou commandez un livre d'art imprimé."
                  }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <span className="text-5xl font-serif font-light text-stone-200">{item.step}</span>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 mb-2">{item.title}</h3>
                      <p className="text-stone-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Print Section */}
      <section id="print" className="py-24 bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-stone-800/50 skew-x-12 transform origin-top"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-serif font-bold">
                Du digital au papier d'art.
              </h2>
              <p className="text-stone-300 text-lg leading-relaxed">
                Quand vous êtes prêts, transformez vos souvenirs numériques en un objet d'exception. 
                Papier mat premium, couverture rigide en toile, et une mise en page automatique digne d'un graphiste.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Papier certifié FSC éco-responsable",
                  "Impression locale (Canada & Europe)",
                  "QR Codes pour lire vos vidéos",
                  "Mise en page intelligente"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-300">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-stone-900">
                      <CheckCircle size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Button className="bg-white text-stone-900 hover:bg-stone-100 rounded-full px-8 py-6 text-lg mt-4">
                Commander un échantillon
              </Button>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-stone-700"
            >
              <img src={printImage} alt="Livre imprimé sur une table" className="w-full h-auto" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                <p className="font-serif text-xl italic">"La qualité est incroyable, c'est un trésor pour notre famille."</p>
                <p className="text-stone-400 text-sm mt-2">— Sophie & Marc, Parents de Léo</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-stone-900">
            Commencez l'histoire de votre enfant aujourd'hui.
          </h2>
          <p className="text-xl text-stone-600">
            Ne laissez plus les souvenirs s'effacer dans la galerie de votre téléphone.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
             <Link href="/register">
              <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-10 h-16 text-xl">
                Créer mon compte gratuit
              </Button>
            </Link>
          </div>
          <p className="text-sm text-stone-500">Aucune carte de crédit requise. 15 jours d'essai Premium offerts.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}