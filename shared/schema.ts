import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: text("password"),
  fullName: text("full_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  address: text("address"),
  gender: text("gender"),
  phone: text("phone"),
  country: text("country"),
  authProvider: text("auth_provider").default("email"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  childName: text("child_name").notNull(),
  coverImage: text("cover_image"),
  birthDate: timestamp("birth_date"),
  birthWeight: text("birth_weight"),
  birthHeight: text("birth_height"),
  birthTime: text("birth_time"),
  familyName: text("family_name"),
  babyStatus: text("baby_status"), // born, expecting, adoption
  babyGender: text("baby_gender"),
  notificationWeekday: integer("notification_weekday"), // 0=Sunday, 1=Monday, ..., 6=Saturday (for adoption)
  bookType: text("book_type").default("custom"), // prebuilt, custom
  templateSlug: text("template_slug"), // Reference to template used if prebuilt
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books, {
  birthDate: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;

export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  isVideo: boolean("is_video").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memories.$inferSelect;

export const userPlans = pgTable("user_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  plan: text("plan").notNull().default("free"), // free, premium, platine
  storageUsed: integer("storage_used").notNull().default(0), // in MB
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserPlanSchema = createInsertSchema(userPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UserPlan = typeof userPlans.$inferSelect;

export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memoryId: varchar("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }).unique(),
  qrUrl: text("qr_url").notNull(),
  videoUrl: text("video_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;
export type QRCode = typeof qrCodes.$inferSelect;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Book pages table for storing album pages with their content
export const bookPages = pgTable("book_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  pageIndex: integer("page_index").notNull(),
  title: text("title").notNull().default(""),
  subtitle: text("subtitle").default(""),
  date: text("date").default(""),
  description: text("description").default(""),
  layoutStyle: text("layout_style").default("single"),
  images: jsonb("images").default([]),
  content: jsonb("content").default([]),
  treeMembers: jsonb("tree_members"),
  familyMembers: jsonb("family_members"),
  backgroundImage: text("background_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookPageSchema = createInsertSchema(bookPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBookPage = z.infer<typeof insertBookPageSchema>;
export type BookPage = typeof bookPages.$inferSelect;

// Notifications table for reminders and milestone alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // milestone, reminder, custom, anniversary
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon").default("bell"), // bell, cake, baby, heart, star, camera
  triggerDate: timestamp("trigger_date").notNull(),
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  actionUrl: text("action_url"), // URL to navigate when clicked
  milestoneAge: integer("milestone_age"), // Age in days when milestone occurs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// User notification preferences
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  milestoneReminders: boolean("milestone_reminders").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  birthdayReminders: boolean("birthday_reminders").default(true),
  customReminderDays: integer("custom_reminder_days").default(7), // Days before milestone to remind
  notificationFrequency: text("notification_frequency").default("weekly"), // daily, weekly, monthly, none
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;

// Book templates table - defines available book templates (prebuilt vs custom)
export const bookTemplates = pgTable("book_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(), // 'prebuilt_pregnancy', 'custom'
  nameFr: text("name_fr").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  coverImage: text("cover_image"),
  iconName: text("icon_name").default("book"), // For display in selection UI
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookTemplateSchema = createInsertSchema(bookTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertBookTemplate = z.infer<typeof insertBookTemplateSchema>;
export type BookTemplate = typeof bookTemplates.$inferSelect;

// Template sections - defines the predefined pages/sections for each template
export const templateSections = pgTable("template_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => bookTemplates.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),
  titleFr: text("title_fr").notNull(),
  titleEn: text("title_en").notNull(),
  subtitleFr: text("subtitle_fr"),
  subtitleEn: text("subtitle_en"),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  layoutStyle: text("layout_style").default("single"), // single, collage, timeline, family_tree
  sectionType: text("section_type").notNull(), // pregnancy_month, family_intro, announcement, nursery, monthly_milestone
  dateOffsetDays: integer("date_offset_days"), // Days from birth/due date
  monthNumber: integer("month_number"), // For pregnancy or milestone months (1-12)
  placeholderImages: jsonb("placeholder_images").default([]),
  defaultContent: jsonb("default_content").default({}),
  backgroundImage: text("background_image"),
  iconName: text("icon_name"),
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplateSectionSchema = createInsertSchema(templateSections).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplateSection = z.infer<typeof insertTemplateSectionSchema>;
export type TemplateSection = typeof templateSections.$inferSelect;
