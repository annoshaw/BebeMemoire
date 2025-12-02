import { db } from "./db";
import { bookTemplates, templateSections } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedTemplates() {
  console.log("Seeding book templates...");

  // Check if templates already exist
  const existingTemplates = await db.select().from(bookTemplates);
  if (existingTemplates.length > 0) {
    console.log("Templates already exist, skipping seed.");
    return;
  }

  // Create the prebuilt pregnancy journey template
  const [prebuiltTemplate] = await db.insert(bookTemplates).values({
    slug: "prebuilt_pregnancy",
    nameFr: "Parcours Grossesse & Bébé",
    nameEn: "Pregnancy & Baby Journey",
    descriptionFr: "Un livre préconçu avec des pages pour chaque étape : grossesse, annonce, chambre de bébé et moisnniversaires",
    descriptionEn: "A pre-designed book with pages for each milestone: pregnancy, announcement, nursery and monthly milestones",
    iconName: "baby",
    isActive: true,
    sortOrder: 1,
  }).returning();

  // Create the custom template
  const [customTemplate] = await db.insert(bookTemplates).values({
    slug: "custom",
    nameFr: "Livre Personnalisé",
    nameEn: "Custom Book",
    descriptionFr: "Créez votre propre album 100% personnalisable avec vos propres pages et mises en page",
    descriptionEn: "Create your own 100% customizable album with your own pages and layouts",
    iconName: "edit",
    isActive: true,
    sortOrder: 2,
  }).returning();

  console.log("Created templates:", prebuiltTemplate.slug, customTemplate.slug);

  // Create sections for the prebuilt template
  const sections = [
    // Pregnancy months (1-9)
    ...Array.from({ length: 9 }, (_, i) => ({
      templateId: prebuiltTemplate.id,
      orderIndex: i,
      titleFr: `Mois ${i + 1} de grossesse`,
      titleEn: `Pregnancy Month ${i + 1}`,
      subtitleFr: i === 0 ? "Le début de l'aventure" : i === 8 ? "Bientôt la rencontre" : null,
      subtitleEn: i === 0 ? "The beginning of the journey" : i === 8 ? "Soon the big meeting" : null,
      descriptionFr: `Comment te sens-tu à ${i + 1} mois de grossesse ?`,
      descriptionEn: `How are you feeling at ${i + 1} months pregnant?`,
      layoutStyle: "single",
      sectionType: "pregnancy_month",
      dateOffsetDays: -(280 - (i + 1) * 30), // Approx days before due date
      monthNumber: i + 1,
      iconName: "favorite",
      isRequired: false,
    })),
    // Family introduction
    {
      templateId: prebuiltTemplate.id,
      orderIndex: 9,
      titleFr: "Notre famille",
      titleEn: "Our Family",
      subtitleFr: "Présentation de la famille",
      subtitleEn: "Family Introduction",
      descriptionFr: "Qui compose notre belle famille ?",
      descriptionEn: "Who makes up our beautiful family?",
      layoutStyle: "family_tree",
      sectionType: "family_intro",
      dateOffsetDays: null,
      monthNumber: null,
      iconName: "people",
      isRequired: false,
    },
    // Pregnancy announcement reactions
    {
      templateId: prebuiltTemplate.id,
      orderIndex: 10,
      titleFr: "L'annonce de la grossesse",
      titleEn: "Pregnancy Announcement",
      subtitleFr: "Les réactions de nos proches",
      subtitleEn: "Our loved ones' reactions",
      descriptionFr: "Comment avons-nous annoncé la nouvelle et quelles ont été les réactions ?",
      descriptionEn: "How did we share the news and what were the reactions?",
      layoutStyle: "collage",
      sectionType: "announcement",
      dateOffsetDays: -240, // Around 12 weeks
      monthNumber: null,
      iconName: "celebration",
      isRequired: false,
    },
    // Nursery / Baby room
    {
      templateId: prebuiltTemplate.id,
      orderIndex: 11,
      titleFr: "La chambre de bébé",
      titleEn: "Baby's Nursery",
      subtitleFr: "Son petit nid douillet",
      subtitleEn: "Their cozy little nest",
      descriptionFr: "La chambre est prête pour accueillir notre trésor",
      descriptionEn: "The room is ready to welcome our little treasure",
      layoutStyle: "collage",
      sectionType: "nursery",
      dateOffsetDays: -30, // About a month before due date
      monthNumber: null,
      iconName: "crib",
      isRequired: false,
    },
    // Birth day
    {
      templateId: prebuiltTemplate.id,
      orderIndex: 12,
      titleFr: "Jour de naissance",
      titleEn: "Birth Day",
      subtitleFr: "Le plus beau jour",
      subtitleEn: "The most beautiful day",
      descriptionFr: "Tu es enfin là parmi nous !",
      descriptionEn: "You're finally here with us!",
      layoutStyle: "single",
      sectionType: "birth_day",
      dateOffsetDays: 0,
      monthNumber: null,
      iconName: "cake",
      isRequired: true,
    },
    // Monthly milestones (1-12 months)
    ...Array.from({ length: 12 }, (_, i) => ({
      templateId: prebuiltTemplate.id,
      orderIndex: 13 + i,
      titleFr: `${i + 1} mois`,
      titleEn: `${i + 1} Month${i > 0 ? 's' : ''}`,
      subtitleFr: i === 0 ? "Premier moisnniversaire" : `${i + 1}ème moisnniversaire`,
      subtitleEn: i === 0 ? "First month milestone" : `${i + 1} months milestone`,
      descriptionFr: `Tes découvertes et progrès à ${i + 1} mois`,
      descriptionEn: `Your discoveries and progress at ${i + 1} month${i > 0 ? 's' : ''}`,
      layoutStyle: "timeline",
      sectionType: "monthly_milestone",
      dateOffsetDays: (i + 1) * 30, // Days after birth
      monthNumber: i + 1,
      iconName: "star",
      isRequired: false,
    })),
  ];

  // Insert all sections
  for (const section of sections) {
    await db.insert(templateSections).values(section);
  }

  console.log(`Created ${sections.length} template sections for prebuilt template`);
  console.log("Template seeding complete!");
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding templates:", error);
    process.exit(1);
  });
