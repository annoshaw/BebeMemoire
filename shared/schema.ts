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
  role: text("role").notNull().default("user"), // user, admin
  stripeCustomerId: varchar("stripe_customer_id"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  subscriptionReminderSentAt: timestamp("subscription_reminder_sent_at"),
  activeGiftCertificateId: varchar("active_gift_certificate_id"),
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

// Template parts - defines the main sections/chapters of a book template
export const templateParts = pgTable("template_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => bookTemplates.id, { onDelete: "cascade" }),
  partNumber: integer("part_number").notNull(),
  titleFr: text("title_fr").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplatePartSchema = createInsertSchema(templateParts).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplatePart = z.infer<typeof insertTemplatePartSchema>;
export type TemplatePart = typeof templateParts.$inferSelect;

// Template pages - defines the predefined pages for each template
export const templatePages = pgTable("template_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => bookTemplates.id, { onDelete: "cascade" }),
  partId: varchar("part_id").references(() => templateParts.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  titleFr: text("title_fr").notNull(),
  titleEn: text("title_en").notNull(),
  subtitleFr: text("subtitle_fr"),
  subtitleEn: text("subtitle_en"),
  promptsFr: jsonb("prompts_fr").default([]), // Array of guiding questions in French
  promptsEn: jsonb("prompts_en").default([]), // Array of guiding questions in English
  pageType: text("page_type").notNull(), // text_photo, text_video, collage, birth_info, message, timeline
  layoutStyle: text("layout_style").default("single"), // single, dual, collage_grid, full_photo
  maxPhotos: integer("max_photos").default(1), // For collage pages: 1-15
  hasVideo: boolean("has_video").default(false),
  hasTextBlocks: integer("has_text_blocks").default(1), // Number of text areas
  iconName: text("icon_name"),
  backgroundImage: text("background_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTemplatePageSchema = createInsertSchema(templatePages).omit({
  id: true,
  createdAt: true,
});

export type InsertTemplatePage = z.infer<typeof insertTemplatePageSchema>;
export type TemplatePage = typeof templatePages.$inferSelect;

// Template sections - defines the predefined pages/sections for each template (legacy - kept for compatibility)
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
  layoutStyle: text("layout_style").default("single"),
  sectionType: text("section_type").notNull(),
  dateOffsetDays: integer("date_offset_days"),
  monthNumber: integer("month_number"),
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

// User book pages - stores the actual content filled by users for each page
export const userBookPages = pgTable("user_book_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  templatePageId: varchar("template_page_id").references(() => templatePages.id),
  pageNumber: integer("page_number").notNull(),
  titleOverride: text("title_override"), // User can customize the title
  textContent: jsonb("text_content").default([]), // Array of text blocks with content
  photos: jsonb("photos").default([]), // Array of photo URLs
  videoUrl: text("video_url"), // Legacy: kept for backward compatibility
  videoMediaId: varchar("video_media_id"), // Reference to mediaFiles for persistent video URLs
  customData: jsonb("custom_data").default({}), // For special pages like birth_info
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserBookPageSchema = createInsertSchema(userBookPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserBookPage = z.infer<typeof insertUserBookPageSchema>;
export type UserBookPage = typeof userBookPages.$inferSelect;

// Media files table for S3 storage tracking
export const mediaFiles = pgTable("media_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }),
  pageId: varchar("page_id").references(() => userBookPages.id, { onDelete: "set null" }),
  s3Key: text("s3_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(), // in bytes
  mediaType: text("media_type").notNull(), // photo, video
  status: text("status").notNull().default("pending"), // pending, uploaded, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  uploadedAt: timestamp("uploaded_at"),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
});

export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

// =====================================================
// ADMIN & E-COMMERCE TABLES (Phase 0-1)
// =====================================================

// Extend users with role for admin access
// Note: role field added to users table via migration

// Subscriptions table - Stripe subscription tracking
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  plan: text("plan").notNull().default("free"), // free, premium, platine
  status: text("status").notNull().default("active"), // active, canceled, past_due, incomplete
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Orders table - Print orders tracking
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "set null" }),
  orderNumber: varchar("order_number").notNull().unique(), // Human-readable order number
  status: text("status").notNull().default("pending"), // pending, processing, printing, shipped, delivered, cancelled
  productType: text("product_type").notNull(), // softcover, hardcover, ebook (primary for single item orders)
  quantity: integer("quantity").notNull().default(1),
  orderItems: jsonb("order_items").default([]), // Array of {productType, quantity, bookId, bookName} for multi-item orders
  pageCount: integer("page_count").notNull().default(50),
  basePrice: integer("base_price").notNull(), // in cents
  extraPagesPrice: integer("extra_pages_price").notNull().default(0), // in cents
  shippingPrice: integer("shipping_price").notNull().default(0), // in cents
  taxAmount: integer("tax_amount").notNull().default(0), // in cents
  totalAmount: integer("total_amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("CAD"),
  // Shipping info
  shippingName: text("shipping_name"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCountry: text("shipping_country"),
  shippingPhone: text("shipping_phone"),
  // Payment info
  stripeSessionId: varchar("stripe_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  paidAt: timestamp("paid_at"),
  // PDF export
  pdfExportKey: text("pdf_export_key"), // S3 key for generated PDF
  pdfGeneratedAt: timestamp("pdf_generated_at"),
  // Tracking
  trackingNumber: varchar("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  // Notes
  adminNotes: text("admin_notes"),
  customerNotes: text("customer_notes"),
  // Payment reminders
  reminderSentAt: timestamp("reminder_sent_at"),
  reminderCount: integer("reminder_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order events table - Audit trail for order status changes
export const orderEvents = pgTable("order_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // status_change, payment_received, shipped, note_added
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  description: text("description"),
  performedBy: varchar("performed_by").references(() => users.id), // Admin who made the change
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderEventSchema = createInsertSchema(orderEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderEvent = z.infer<typeof insertOrderEventSchema>;
export type OrderEvent = typeof orderEvents.$inferSelect;

// Payments table - All payment transactions
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeChargeId: varchar("stripe_charge_id"),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("CAD"),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, refunded
  paymentMethod: text("payment_method"), // card, paypal
  paymentType: text("payment_type").notNull(), // order, subscription
  description: text("description"),
  receiptUrl: text("receipt_url"),
  failureReason: text("failure_reason"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// PDF Exports table - Track generated PDFs
// Shared status values: pending, generating, completed, downloaded, sent, failed
export const pdfExports = pgTable("pdf_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  s3Key: text("s3_key").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size"), // in bytes
  pageCount: integer("page_count"),
  status: text("status").notNull().default("pending"), // pending, generating, completed, downloaded, sent, failed
  manualOverride: boolean("manual_override").default(false), // true if status was manually set by admin
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"), // For temporary download links
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPdfExportSchema = createInsertSchema(pdfExports).omit({
  id: true,
  createdAt: true,
});

export type InsertPdfExport = z.infer<typeof insertPdfExportSchema>;
export type PdfExport = typeof pdfExports.$inferSelect;

// Admin activity log - For audit trail
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // view_order, update_order, view_user, export_data, etc.
  targetType: text("target_type"), // order, user, subscription
  targetId: varchar("target_id"),
  details: jsonb("details").default({}),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;

// Email campaigns table - For admin promotional emails
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  audienceFilter: text("audience_filter").notNull().default("all"), // all, premium, free
  status: text("status").notNull().default("draft"), // draft, sending, sent, failed
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// Subscription discounts table - For admin-created discounts
export const subscriptionDiscounts = pgTable("subscription_discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // percentage, fixed
  value: integer("value").notNull(), // percentage (0-100) or cents
  scope: text("scope").notNull().default("user"), // user, plan, global
  targetPlan: text("target_plan"), // null = all plans, or specific plan
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  maxRedemptions: integer("max_redemptions"),
  redemptionCount: integer("redemption_count").default(0),
  appliesRetroactively: boolean("applies_retroactively").default(false),
  isActive: boolean("is_active").default(true),
  stripeCouponId: varchar("stripe_coupon_id"), // Stripe coupon ID for automatic billing
  durationMonths: integer("duration_months").default(0), // 0 = forever, 1-12 = repeating for N months
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionDiscountSchema = createInsertSchema(subscriptionDiscounts).omit({
  id: true,
  redemptionCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscriptionDiscount = z.infer<typeof insertSubscriptionDiscountSchema>;
export type SubscriptionDiscount = typeof subscriptionDiscounts.$inferSelect;

// User subscription discounts - Junction table for applied discounts
export const userSubscriptionDiscounts = pgTable("user_subscription_discounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  discountId: varchar("discount_id").notNull().references(() => subscriptionDiscounts.id, { onDelete: "cascade" }),
  appliedBy: varchar("applied_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  retroactiveChargeId: varchar("retroactive_charge_id"),
  notes: text("notes"),
});

export const insertUserSubscriptionDiscountSchema = createInsertSchema(userSubscriptionDiscounts).omit({
  id: true,
  appliedAt: true,
});

export type InsertUserSubscriptionDiscount = z.infer<typeof insertUserSubscriptionDiscountSchema>;
export type UserSubscriptionDiscount = typeof userSubscriptionDiscounts.$inferSelect;

// Subscription plan history - Audit trail for plan changes
export const subscriptionPlanHistory = pgTable("subscription_plan_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  previousPlan: text("previous_plan"),
  newPlan: text("new_plan").notNull(),
  changeSource: text("change_source").notNull(), // user, admin, system, stripe
  adminId: varchar("admin_id").references(() => users.id, { onDelete: "set null" }),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  prorationAmount: integer("proration_amount"), // in cents
  effectiveAt: timestamp("effective_at").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanHistorySchema = createInsertSchema(subscriptionPlanHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriptionPlanHistory = z.infer<typeof insertSubscriptionPlanHistorySchema>;
export type SubscriptionPlanHistory = typeof subscriptionPlanHistory.$inferSelect;

// Book invitations - Share book with other users
export const bookInvitations = pgTable("book_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  invitedByUserId: varchar("invited_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  role: text("role").notNull(), // collaborator, observer
  token: varchar("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, expired
  acceptedByUserId: varchar("accepted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookInvitationSchema = createInsertSchema(bookInvitations).omit({
  id: true,
  createdAt: true,
});

export type InsertBookInvitation = z.infer<typeof insertBookInvitationSchema>;
export type BookInvitation = typeof bookInvitations.$inferSelect;

// Book collaborators - Active access to shared books
export const bookCollaborators = pgTable("book_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // collaborator, observer
  addedByUserId: varchar("added_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookCollaboratorSchema = createInsertSchema(bookCollaborators).omit({
  id: true,
  createdAt: true,
});

export type InsertBookCollaborator = z.infer<typeof insertBookCollaboratorSchema>;
export type BookCollaborator = typeof bookCollaborators.$inferSelect;

// Gift Certificates
export const giftCertificates = pgTable("gift_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  purchaserEmail: varchar("purchaser_email").notNull(),
  purchaserName: varchar("purchaser_name"),
  recipientEmail: varchar("recipient_email"),
  recipientName: varchar("recipient_name"),
  productType: text("product_type").notNull(), // softcover, hardcover, ebook
  includesSubscription: boolean("includes_subscription").default(false),
  subscriptionType: text("subscription_type"), // premium, platine, null
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("cad"),
  stripeSessionId: varchar("stripe_session_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"), // pending, paid, sent, redeemed, expired, refunded
  redeemedByUserId: varchar("redeemed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at"),
  emailSentAt: timestamp("email_sent_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGiftCertificateSchema = createInsertSchema(giftCertificates).omit({
  id: true,
  createdAt: true,
});

export type InsertGiftCertificate = z.infer<typeof insertGiftCertificateSchema>;
export type GiftCertificate = typeof giftCertificates.$inferSelect;
