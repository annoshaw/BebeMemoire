import { motion } from "framer-motion";
import { ArrowRight, Smartphone, Heart, Video, Users, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Link } from "wouter";
import { useMemoStore } from "@/store/useMemoStore";

// Import generated assets
import heroImage from "@assets/generated_images/happy_parents_with_baby_looking_at_tablet.png";
import appImage from "@assets/generated_images/memo_editor_page.png";
import printImage from "@assets/generated_images/high_quality_printed_baby_book.png";
import creatorImage from "@assets/generated_images/ann_sophie_photo.png";
import logoMemo from "@/assets/logo-memo.png";

const translations = {
  fr: {
    availability: "Disponible au Canada & Europe",
    trialBadge: "14 jours d'essai Premium GRATUIT",
    heroTitle1: "Le livre de naissance",
    heroTitle2: "réinventé.",
    heroDescription: "Remplissez le livre depuis votre mobile ou tablette, à votre rythme. Ajoutez photos, vidéos et moments spéciaux. Personnalisez chaque page selon votre famille. Imprimez un livre unique où les vidéos sont accessibles par code QR.",
    startStory: "Commencer l'histoire",
    viewDemo: "Voir la démo",
    firstSmile: "Premier sourire",
    addedAgo: "Ajouté il y a 2 min",
    creatorTitle: "L'histoire derrière Mémo",
    creatorP1: "Je suis Ann‑Sophie Shaw, maman de deux petites filles du Saguenay–Lac‑Saint‑Jean.",
    creatorP2: "Mémo est né dans les premiers mois de ma maternité, alors que j'essayais de capturer des moments trop précieux pour être oubliés. Entre les pages qui restaient vides, les milliers de photos à trier et le tourbillon de la vie de maman, j'ai rêvé d'un livre qui se remplirait naturellement, au rythme de notre histoire.",
    creatorP3: "Aujourd'hui, Mémo existe pour ça : garder vivants les souvenirs, les images, les vidéos et l'émotion des débuts — et créer un héritage que nos enfants pourront tenir entre leurs mains.",
    creatorSign: "— Ann‑Sophie",
    featuresTitle: "Conçu pour la vraie vie de parent",
    featuresDesc: "Oubliez la culpabilité du livre vide. Mémo s'adapte à votre rythme, capture vos vidéos, et ne garde que le meilleur.",
    feature1Title: "Toujours accessible",
    feature1Desc: "Remplissez-le pendant la tétée, dans le bus, ou en attendant le pédiatre. Votre livre est toujours dans votre poche.",
    feature2Title: "Photos & Vidéos",
    feature2Desc: "Une photo fige l'instant, une vidéo capture l'émotion. Intégrez vos vidéos marquantes via des QR codes élégants.",
    feature3Title: "Création Collaborative",
    feature3Desc: "Partagez la création de votre album avec les autres. Ajoutez des utilisateurs qui vous aideront à ajouter des photos et des descriptions.",
    feature4Title: "Inclusivité Totale",
    feature4Desc: "Adapté à toutes les familles : monoparentales, homoparentales, adoptions, naissances multiples. C'est votre histoire.",
    feature5Title: "Notifications Intelligentes",
    feature5Desc: "Recevez des suggestions personnalisées : 'Vous êtes à 6 mois, une photo du ventre ?' ou 'Léo a 1 an aujourd'hui !'",
    feature6Title: "Zéro gaspillage",
    feature6Desc: "Fini les pages 'Première dent' qui restent vides. Vous choisissez quelles pages imprimer. Personnalisation totale.",
    pricingTitle: "Une formule pour chaque famille",
    pricingDesc: "Commencez gratuitement, évoluez selon vos souvenirs.",
    trialBox: "14 jours d'essai Premium GRATUIT",
    trialBoxDesc: "Testez toutes les fonctionnalités sans engagement",
    planFree: "Découverte",
    planFreePrice: "Gratuit",
    planFreeDesc: "Parfait pour commencer",
    planFreeFeatures: ["Accès à l'application", "1 Go de stockage photos", "Création du livre", "Chronologie automatique"],
    planFreeCta: "Commencer",
    planPremium: "Premium",
    planPremiumPrice: "1.99 $ / mois",
    planPremiumDesc: "L'expérience complète",
    planPremiumFeatures: ["QR Codes vidéo inclus", "Photos illimitées", "2 Go de stockage vidéos", "Support prioritaire"],
    planPremiumCta: "Essayer Premium",
    recommended: "Recommandé",
    planPlatine: "Platine",
    planPlatinePrice: "4.99 $ / mois",
    planPlatineDesc: "Pour les vidéastes",
    planPlatineFeatures: ["Tout du Premium", "5 Go de stockage vidéos", "15% de rabais sur l'impression", "Design exclusifs"],
    planPlatineCta: "Choisir Platine",
    howItWorksTitle: "Comment ça marche.",
    step1Title: "Choisissez votre fréquence",
    step1Desc: "Sélectionnez à quelle fréquence vous souhaitez recevoir des notifications push. Nous vous rappellerons les moments importants pour capturer des souvenirs.",
    step2Title: "Capturez vos moments",
    step2Desc: "Capturez les moments qui vous sont chers : photos, vidéos, anecdotes. Ajoutez-les à votre livre en un clic.",
    step3Title: "Personnalisez totalement",
    step3Desc: "Enrichissez votre livre avec des pages d'inspiration : le moment où vous avez appris sa venue, le premier échographie, son gender reveal, son baby shower et bien plus.",
    step4Title: "Commandez votre livre",
    step4Desc: "Choisissez votre format : E-book pour partager instantanément, ou version imprimée avec photos développées et codes QR intégrés pour revivre vos vidéos.",
    printTitle: "Du digital au papier d'art.",
    printDesc: "Quand vous êtes prêts, transformez vos souvenirs numériques en un objet d'exception. Papier mat premium, couverture rigide en toile, et une mise en page automatique digne d'un graphiste.",
    printFeatures: ["Papier certifié FSC éco-responsable", "Impression locale (Canada & Europe)", "QR Codes pour lire vos vidéos", "Mise en page intelligente"],
    printQuote: "\"La qualité est incroyable, c'est un trésor pour notre famille.\"",
    printQuoteAuthor: "— Sophie & Marc, Parents de Léo",
    giftBadge: "Idée cadeau parfaite",
    giftTitle: "Offrez un certificat-cadeau Mémo",
    giftDesc: "Le cadeau idéal pour les futurs parents ou les nouvelles familles. Offrez-leur la possibilité de créer un livre de souvenirs unique et personnalisé.",
    giftFeatures: ["Livraison instantanée par email", "Valide 1 an", "Plusieurs formules disponibles"],
    giftCta: "Acheter un certificat-cadeau",
    giftCard: "Certificat-cadeau",
    giftFrom: "À partir de 30$",
    ctaTitle: "Commencez l'histoire de votre enfant aujourd'hui.",
    ctaDesc: "Ne laissez plus les souvenirs s'effacer dans la galerie de votre téléphone.",
    ctaButton: "Créer mon compte gratuit",
    ctaNote: "Aucune carte de crédit requise. 15 jours d'essai Premium offerts."
  },
  en: {
    availability: "Available in Canada & Europe",
    trialBadge: "14-day FREE Premium trial",
    heroTitle1: "The baby book",
    heroTitle2: "reinvented.",
    heroDescription: "Fill in the book from your mobile or tablet, at your own pace. Add photos, videos and special moments. Customize each page for your family. Print a unique book where videos are accessible via QR code.",
    startStory: "Start the story",
    viewDemo: "View demo",
    firstSmile: "First smile",
    addedAgo: "Added 2 min ago",
    creatorTitle: "The story behind Mémo",
    creatorP1: "I'm Ann-Sophie Shaw, mother of two little girls from Saguenay-Lac-Saint-Jean.",
    creatorP2: "Mémo was born in the first months of my motherhood, when I was trying to capture moments too precious to be forgotten. Between pages that remained blank, thousands of photos to sort through, and the whirlwind of mom life, I dreamed of a book that would fill naturally, at the rhythm of our story.",
    creatorP3: "Today, Mémo exists for this: to keep memories, images, videos and the emotion of beginnings alive — and to create a legacy that our children can hold in their hands.",
    creatorSign: "— Ann-Sophie",
    featuresTitle: "Designed for real parent life",
    featuresDesc: "Forget the guilt of the empty book. Mémo adapts to your pace, captures your videos, and keeps only the best.",
    feature1Title: "Always accessible",
    feature1Desc: "Fill it during feeding, on the bus, or while waiting at the pediatrician. Your book is always in your pocket.",
    feature2Title: "Photos & Videos",
    feature2Desc: "A photo freezes the moment, a video captures the emotion. Integrate your memorable videos via elegant QR codes.",
    feature3Title: "Collaborative Creation",
    feature3Desc: "Share your album creation with others. Add users who will help you add photos and descriptions.",
    feature4Title: "Total Inclusivity",
    feature4Desc: "Adapted to all families: single-parent, same-sex, adoptions, multiple births. It's your story.",
    feature5Title: "Smart Notifications",
    feature5Desc: "Receive personalized suggestions: 'You're at 6 months, a belly photo?' or 'Léo turns 1 today!'",
    feature6Title: "Zero waste",
    feature6Desc: "No more empty 'First tooth' pages. You choose which pages to print. Total customization.",
    pricingTitle: "A plan for every family",
    pricingDesc: "Start for free, evolve with your memories.",
    trialBox: "14-day FREE Premium trial",
    trialBoxDesc: "Test all features with no commitment",
    planFree: "Discovery",
    planFreePrice: "Free",
    planFreeDesc: "Perfect to start",
    planFreeFeatures: ["App access", "1 GB photo storage", "Book creation", "Automatic timeline"],
    planFreeCta: "Get started",
    planPremium: "Premium",
    planPremiumPrice: "$1.99 / month",
    planPremiumDesc: "The complete experience",
    planPremiumFeatures: ["Video QR codes included", "Unlimited photos", "2 GB video storage", "Priority support"],
    planPremiumCta: "Try Premium",
    recommended: "Recommended",
    planPlatine: "Platinum",
    planPlatinePrice: "$4.99 / month",
    planPlatineDesc: "For videographers",
    planPlatineFeatures: ["Everything in Premium", "5 GB video storage", "15% off printing", "Exclusive designs"],
    planPlatineCta: "Choose Platinum",
    howItWorksTitle: "How it works.",
    step1Title: "Choose your frequency",
    step1Desc: "Select how often you want to receive push notifications. We'll remind you of important moments to capture memories.",
    step2Title: "Capture your moments",
    step2Desc: "Capture the moments you cherish: photos, videos, anecdotes. Add them to your book in one click.",
    step3Title: "Fully customize",
    step3Desc: "Enrich your book with inspiration pages: the moment you learned of their arrival, the first ultrasound, gender reveal, baby shower and more.",
    step4Title: "Order your book",
    step4Desc: "Choose your format: E-book to share instantly, or printed version with developed photos and integrated QR codes to relive your videos.",
    printTitle: "From digital to art paper.",
    printDesc: "When you're ready, transform your digital memories into an exceptional object. Premium matte paper, hardcover linen binding, and automatic layout worthy of a graphic designer.",
    printFeatures: ["FSC-certified eco-friendly paper", "Local printing (Canada & Europe)", "QR codes to watch your videos", "Smart layout"],
    printQuote: "\"The quality is incredible, it's a treasure for our family.\"",
    printQuoteAuthor: "— Sophie & Marc, Parents of Léo",
    giftBadge: "Perfect gift idea",
    giftTitle: "Give a Mémo gift certificate",
    giftDesc: "The ideal gift for expecting parents or new families. Give them the opportunity to create a unique and personalized memory book.",
    giftFeatures: ["Instant email delivery", "Valid for 1 year", "Multiple options available"],
    giftCta: "Buy a gift certificate",
    giftCard: "Gift certificate",
    giftFrom: "Starting at $30",
    ctaTitle: "Start your child's story today.",
    ctaDesc: "Don't let memories fade in your phone's gallery.",
    ctaButton: "Create my free account",
    ctaNote: "No credit card required. 15 days of Premium trial included."
  }
};

export default function Home() {
  const { language } = useMemoStore();
  const t = translations[language];
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
                {t.availability}
              </div>
              
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold shadow-lg ml-2">
                <span className="mr-2">🎁</span>
                {t.trialBadge}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <img src={logoMemo} alt="Mémo" className="h-24 sm:h-32 w-auto" />
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-serif font-bold text-stone-900 leading-[1.1]">
                {t.heroTitle1} <br/>
                <span className="text-primary italic">{t.heroTitle2}</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-stone-600 leading-relaxed max-w-lg">
                {t.heroDescription}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/20">
                    {t.startStory}
                  </Button>
                </Link>
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
                  <span className="text-xs font-bold text-stone-800">{t.firstSmile}</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4"></div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 text-right">{t.addedAgo}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-16 bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-shrink-0"
            >
              <div className="w-40 h-52 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={creatorImage} 
                  alt="Ann-Sophie Shaw, créatrice de Mémo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-4"
            >
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-stone-900">
                {t.creatorTitle}
              </h2>
              <div className="space-y-3 text-stone-600 text-sm lg:text-base leading-relaxed">
                <p>{t.creatorP1}</p>
                <p>{t.creatorP2}</p>
                <p>{t.creatorP3}</p>
              </div>
              <p className="text-stone-800 font-medium italic text-sm">{t.creatorSign}</p>
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
            <h2 className="text-4xl font-serif font-bold text-stone-900 mb-6">{t.featuresTitle}</h2>
            <p className="text-lg text-stone-600">
              {t.featuresDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="w-8 h-8 text-primary" />,
                title: t.feature1Title,
                desc: t.feature1Desc
              },
              {
                icon: <Video className="w-8 h-8 text-secondary-foreground" />,
                title: t.feature2Title,
                desc: t.feature2Desc
              },
              {
                icon: <Users className="w-8 h-8 text-stone-800" />,
                title: t.feature3Title,
                desc: t.feature3Desc
              },
              {
                icon: <Heart className="w-8 h-8 text-red-400" />,
                title: t.feature4Title,
                desc: t.feature4Desc
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-primary" />,
                title: t.feature5Title,
                desc: t.feature5Desc
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-stone-700" />,
                title: t.feature6Title,
                desc: t.feature6Desc
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
            <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4">{t.pricingTitle}</h2>
            <p className="text-lg text-stone-600 mb-4">{t.pricingDesc}</p>
            <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg">
              <span className="text-2xl mr-3">🎁</span>
              <div className="text-left">
                <p className="text-lg">{t.trialBox}</p>
                <p className="text-sm font-normal opacity-90">{t.trialBoxDesc}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: t.planFree,
                price: t.planFreePrice,
                desc: t.planFreeDesc,
                features: t.planFreeFeatures,
                cta: t.planFreeCta,
                highlight: false
              },
              {
                name: t.planPremium,
                price: t.planPremiumPrice,
                desc: t.planPremiumDesc,
                features: t.planPremiumFeatures,
                cta: t.planPremiumCta,
                highlight: true
              },
              {
                name: t.planPlatine,
                price: t.planPlatinePrice,
                desc: t.planPlatineDesc,
                features: t.planPlatineFeatures,
                cta: t.planPlatineCta,
                highlight: false
              }
            ].map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-8 ${plan.highlight ? 'bg-stone-900 text-white shadow-xl scale-105 z-10' : 'bg-stone-50 text-stone-900 border border-stone-100'}`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                    {t.recommended}
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-serif font-bold mb-2">{plan.price}</div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-stone-400' : 'text-stone-500'}`}>{plan.desc}</p>
                <ul className="space-y-4">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className={plan.highlight ? 'text-primary' : 'text-stone-400'} />
                      {feat}
                    </li>
                  ))}
                </ul>
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
                {t.howItWorksTitle}
              </h2>
              
              <div className="space-y-8">
                {[
                  {
                    step: "01",
                    title: t.step1Title,
                    desc: t.step1Desc
                  },
                  {
                    step: "02",
                    title: t.step2Title,
                    desc: t.step2Desc
                  },
                  {
                    step: "03",
                    title: t.step3Title,
                    desc: t.step3Desc
                  },
                  {
                    step: "04",
                    title: t.step4Title,
                    desc: t.step4Desc
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
                {t.printTitle}
              </h2>
              <p className="text-stone-300 text-lg leading-relaxed">
                {t.printDesc}
              </p>
              
              <ul className="space-y-4">
                {t.printFeatures.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-300">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-stone-900">
                      <CheckCircle size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-stone-700"
            >
              <img src={printImage} alt="Livre imprimé sur une table" className="w-full h-auto" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                <p className="font-serif text-xl italic">{t.printQuote}</p>
                <p className="text-stone-400 text-sm mt-2">{t.printQuoteAuthor}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gift Certificate Section */}
      <section className="py-20 bg-gradient-to-br from-secondary/20 via-white to-primary/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-6 w-fit">
                  <span className="mr-2">🎁</span>
                  {t.giftBadge}
                </div>
                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-stone-900 mb-4">
                  {t.giftTitle}
                </h2>
                <p className="text-stone-600 mb-6 leading-relaxed">
                  {t.giftDesc}
                </p>
                <ul className="space-y-3 mb-8">
                  {t.giftFeatures.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-stone-600">
                      <CheckCircle size={18} className="text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/certificat-cadeau">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/20 w-full sm:w-auto">
                    {t.giftCta}
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="bg-gradient-to-br from-primary/5 to-secondary/10 p-8 lg:p-12 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-40 bg-white rounded-xl shadow-lg border border-stone-200 p-6 transform rotate-3 absolute -top-2 -left-2 opacity-60"></div>
                  <div className="w-64 h-40 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-xl p-6 relative z-10 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <img src={logoMemo} alt="Mémo" className="h-8 w-auto brightness-0 invert" />
                      <span className="font-serif font-bold text-lg">Mémo</span>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{t.giftCard}</p>
                    <p className="text-2xl font-bold">{t.giftFrom}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-stone-900">
            {t.ctaTitle}
          </h2>
          <p className="text-xl text-stone-600">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
             <Link href="/register">
              <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-10 h-16 text-xl">
                {t.ctaButton}
              </Button>
            </Link>
          </div>
          <p className="text-sm text-stone-500">{t.ctaNote}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}