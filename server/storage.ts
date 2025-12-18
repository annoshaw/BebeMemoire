import { db } from "./db";
import { users, books, memories, userPlans, qrCodes, passwordResetTokens, bookPages, notifications, notificationSettings, bookTemplates, templateSections, templateParts, templatePages, userBookPages, mediaFiles, subscriptions, orders, orderEvents, payments, pdfExports, adminActivityLogs, emailCampaigns, subscriptionDiscounts, userSubscriptionDiscounts, subscriptionPlanHistory, bookInvitations, bookCollaborators, giftCertificates, type User, type InsertUser, type UpsertUser, type Book, type InsertBook, type Memory, type InsertMemory, type UserPlan, type InsertUserPlan, type QRCode, type InsertQRCode, type PasswordResetToken, type InsertPasswordResetToken, type BookPage, type InsertBookPage, type Notification, type InsertNotification, type NotificationSettings, type InsertNotificationSettings, type BookTemplate, type InsertBookTemplate, type TemplateSection, type InsertTemplateSection, type TemplatePart, type InsertTemplatePart, type TemplatePage, type InsertTemplatePage, type UserBookPage, type InsertUserBookPage, type MediaFile, type InsertMediaFile, type Subscription, type InsertSubscription, type Order, type InsertOrder, type OrderEvent, type InsertOrderEvent, type Payment, type InsertPayment, type PdfExport, type InsertPdfExport, type AdminActivityLog, type InsertAdminActivityLog, type EmailCampaign, type InsertEmailCampaign, type SubscriptionDiscount, type InsertSubscriptionDiscount, type UserSubscriptionDiscount, type InsertUserSubscriptionDiscount, type SubscriptionPlanHistory, type InsertSubscriptionPlanHistory, type BookInvitation, type BookCollaborator, type GiftCertificate, type InsertGiftCertificate } from "@shared/schema";
import { eq, desc, and, gt, lt, asc, lte, or, isNull, sum, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  completeOnboarding(userId: string): Promise<User | undefined>;
  
  // Book operations
  getBook(id: string): Promise<Book | undefined>;
  getBooksByUserId(userId: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;
  
  // Memory operations
  getMemory(id: string): Promise<Memory | undefined>;
  getMemoriesByBookId(bookId: string): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory | undefined>;
  deleteMemory(id: string): Promise<boolean>;
  
  // User Plan operations
  getUserPlan(userId: string): Promise<UserPlan | undefined>;
  createUserPlan(plan: InsertUserPlan): Promise<UserPlan>;
  updateUserPlan(userId: string, plan: Partial<InsertUserPlan>): Promise<UserPlan | undefined>;
  getStorageLimit(plan: string): number;
  getSubscriptionPlanCounts(): Promise<{ plan: string; count: number }[]>;
  
  // QR Code operations
  getQRCode(memoryId: string): Promise<QRCode | undefined>;
  createQRCode(qrCode: InsertQRCode): Promise<QRCode>;
  deleteQRCode(memoryId: string): Promise<boolean>;
  
  // Password Reset Token operations
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  // Book Page operations
  getBookPages(bookId: string): Promise<BookPage[]>;
  saveBookPages(bookId: string, pages: InsertBookPage[]): Promise<BookPage[]>;
  deleteBookPages(bookId: string): Promise<boolean>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  getActiveNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  createManyNotifications(notifications: InsertNotification[]): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  dismissNotification(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<boolean>;
  deleteNotificationsByBookId(bookId: string): Promise<boolean>;
  
  // Notification Settings operations
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Book Template operations
  getBookTemplates(): Promise<BookTemplate[]>;
  getBookTemplateBySlug(slug: string): Promise<BookTemplate | undefined>;
  getTemplateSections(templateId: string): Promise<TemplateSection[]>;
  createBookTemplate(template: InsertBookTemplate): Promise<BookTemplate>;
  createTemplateSection(section: InsertTemplateSection): Promise<TemplateSection>;
  createBookWithTemplate(userId: string, bookData: InsertBook, templateSlug: string, birthDate?: Date): Promise<{ book: Book; pages: BookPage[] }>;
  
  // Template Parts & Pages operations
  getTemplateParts(templateId: string): Promise<TemplatePart[]>;
  getTemplatePages(templateId: string): Promise<TemplatePage[]>;
  getTemplatePagesByPart(partId: string): Promise<TemplatePage[]>;
  
  // User Book Pages operations
  getUserBookPages(bookId: string): Promise<UserBookPage[]>;
  getUserBookPage(bookId: string, pageNumber: number): Promise<UserBookPage | undefined>;
  createUserBookPage(page: InsertUserBookPage): Promise<UserBookPage>;
  updateUserBookPage(id: string, data: Partial<InsertUserBookPage>): Promise<UserBookPage | undefined>;
  createUserBookPagesFromTemplate(bookId: string, templateId: string, babyStatus?: string): Promise<UserBookPage[]>;
  markPageAsCompleted(id: string): Promise<UserBookPage | undefined>;
  addInspirationPage(bookId: string, pageData: Partial<InsertUserBookPage>): Promise<UserBookPage>;
  deleteInspirationPage(pageId: string): Promise<boolean>;
  
  // Media File operations (S3)
  createMediaFile(media: InsertMediaFile): Promise<MediaFile>;
  getMediaFile(id: string): Promise<MediaFile | undefined>;
  getMediaFileByKey(s3Key: string): Promise<MediaFile | undefined>;
  getMediaFilesByUser(userId: string): Promise<MediaFile[]>;
  getMediaFilesByBook(bookId: string): Promise<MediaFile[]>;
  updateMediaFileStatus(id: string, status: string, uploadedAt?: Date): Promise<MediaFile | undefined>;
  deleteMediaFile(id: string): Promise<boolean>;
  getUserStorageUsed(userId: string): Promise<number>;
  
  // Subscription operations
  getSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByStripeSessionId(sessionId: string): Promise<Order[]>;
  getOrdersByPaymentIntentId(paymentIntentId: string): Promise<Order[]>;
  getAllOrders(limit?: number, offset?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrdersCount(): Promise<number>;
  getOrdersCountByStatus(): Promise<Record<string, number>>;
  
  // Order Events operations
  getOrderEvents(orderId: string): Promise<OrderEvent[]>;
  createOrderEvent(event: InsertOrderEvent): Promise<OrderEvent>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentsByOrderId(orderId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // PDF Export operations
  getPdfExport(id: string): Promise<PdfExport | undefined>;
  getPdfExportsByBook(bookId: string): Promise<PdfExport[]>;
  getAllPdfExports(limit?: number, offset?: number): Promise<PdfExport[]>;
  createPdfExport(pdfExport: InsertPdfExport): Promise<PdfExport>;
  updatePdfExport(id: string, data: Partial<InsertPdfExport>): Promise<PdfExport | undefined>;
  
  // Admin operations
  getAdminUsers(): Promise<User[]>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUsersCount(): Promise<number>;
  setUserRole(userId: string, role: string): Promise<User | undefined>;
  createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog>;
  getAdminActivityLogs(adminId?: string, limit?: number): Promise<AdminActivityLog[]>;
  
  // Admin statistics
  getSubscriptionStats(): Promise<{ plan: string; count: number }[]>;
  getOrderStats(): Promise<{ status: string; count: number; totalAmount: number }[]>;
  getRevenueStats(days: number): Promise<{ date: string; amount: number }[]>;
  
  // Analytics charts
  getGenderStats(): Promise<{ labels: string[]; values: number[] }>;
  getRegionStats(): Promise<{ labels: string[]; values: number[] }>;
  getProductStats(): Promise<{ labels: string[]; values: number[] }>;
  
  // Email campaigns
  getEmailCampaigns(limit?: number, offset?: number): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, data: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  getUserEmailsByFilter(filter: string): Promise<{ id: string; email: string; fullName: string | null }[]>;
  
  // Subscription Discount operations
  createSubscriptionDiscount(discount: InsertSubscriptionDiscount): Promise<SubscriptionDiscount>;
  getSubscriptionDiscount(id: string): Promise<SubscriptionDiscount | undefined>;
  getSubscriptionDiscounts(activeOnly?: boolean): Promise<SubscriptionDiscount[]>;
  updateSubscriptionDiscount(id: string, data: Partial<InsertSubscriptionDiscount>): Promise<SubscriptionDiscount | undefined>;
  deleteSubscriptionDiscount(id: string): Promise<boolean>;
  
  // User Subscription Discount operations
  applyDiscountToUser(data: InsertUserSubscriptionDiscount): Promise<UserSubscriptionDiscount>;
  getUserDiscounts(userId: string): Promise<UserSubscriptionDiscount[]>;
  getUserActiveDiscounts(userId: string): Promise<(UserSubscriptionDiscount & { discount: SubscriptionDiscount })[]>;
  removeUserDiscount(id: string): Promise<boolean>;
  
  // Subscription Plan History operations
  createPlanHistory(history: InsertSubscriptionPlanHistory): Promise<SubscriptionPlanHistory>;
  getUserPlanHistory(userId: string): Promise<SubscriptionPlanHistory[]>;
  
  // Admin subscription management
  getUsersWithSubscriptionDetails(limit?: number, offset?: number, filter?: string): Promise<any[]>;
  getUserSubscriptionDetails(userId: string): Promise<any>;
  
  // Book Invitation operations
  createBookInvitation(data: { bookId: string; invitedByUserId: string; email: string; role: string; token: string; expiresAt: Date }): Promise<any>;
  getBookInvitationByToken(token: string): Promise<any>;
  getBookInvitationsByBook(bookId: string): Promise<any[]>;
  updateBookInvitation(id: string, data: Partial<{ status: string; acceptedByUserId: string; acceptedAt: Date }>): Promise<any>;
  
  // Book Collaborator operations
  createBookCollaborator(data: { bookId: string; userId: string; role: string; addedByUserId: string }): Promise<any>;
  getBookCollaborators(bookId: string): Promise<any[]>;
  getBookCollaborator(bookId: string, userId: string): Promise<any>;
  getBooksSharedWithUser(userId: string): Promise<any[]>;
  removeBookCollaborator(id: string): Promise<boolean>;
  
  // Gift Certificate operations
  createGiftCertificate(data: InsertGiftCertificate): Promise<GiftCertificate>;
  getGiftCertificate(id: string): Promise<GiftCertificate | undefined>;
  getGiftCertificateByCode(code: string): Promise<GiftCertificate | undefined>;
  getGiftCertificateByStripeSession(sessionId: string): Promise<GiftCertificate | undefined>;
  updateGiftCertificate(id: string, data: Partial<InsertGiftCertificate>): Promise<GiftCertificate | undefined>;
  getAllGiftCertificates(): Promise<GiftCertificate[]>;
  getGiftCertificateStats(): Promise<{ total: number; pending: number; paid: number; redeemed: number; totalRevenue: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async completeOnboarding(userId: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Book operations
  async getBook(id: string): Promise<Book | undefined> {
    const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
    return result[0];
  }

  async getBooksByUserId(userId: string): Promise<Book[]> {
    return db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.createdAt));
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const result = await db.insert(books).values(insertBook).returning();
    return result[0];
  }

  async updateBook(id: string, updateData: Partial<InsertBook>): Promise<Book | undefined> {
    const result = await db.update(books).set(updateData).where(eq(books.id, id)).returning();
    return result[0];
  }

  async deleteBook(id: string): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id)).returning();
    return result.length > 0;
  }

  // Memory operations
  async getMemory(id: string): Promise<Memory | undefined> {
    const result = await db.select().from(memories).where(eq(memories.id, id)).limit(1);
    return result[0];
  }

  async getMemoriesByBookId(bookId: string): Promise<Memory[]> {
    return db.select().from(memories).where(eq(memories.bookId, bookId)).orderBy(desc(memories.date));
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const result = await db.insert(memories).values(insertMemory).returning();
    return result[0];
  }

  async updateMemory(id: string, updateData: Partial<InsertMemory>): Promise<Memory | undefined> {
    const result = await db.update(memories).set(updateData).where(eq(memories.id, id)).returning();
    return result[0];
  }

  async deleteMemory(id: string): Promise<boolean> {
    const result = await db.delete(memories).where(eq(memories.id, id)).returning();
    return result.length > 0;
  }

  // User Plan operations
  async getUserPlan(userId: string): Promise<UserPlan | undefined> {
    const result = await db.select().from(userPlans).where(eq(userPlans.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPlan(insertPlan: InsertUserPlan): Promise<UserPlan> {
    const result = await db.insert(userPlans).values(insertPlan).returning();
    return result[0];
  }

  async updateUserPlan(userId: string, updateData: Partial<InsertUserPlan>): Promise<UserPlan | undefined> {
    const result = await db.update(userPlans).set(updateData).where(eq(userPlans.userId, userId)).returning();
    return result[0];
  }

  getStorageLimit(plan: string): number {
    const limits: Record<string, number> = {
      free: 1024, // 1 GB in MB
      premium: 2048, // 2 GB
      platine: 5120, // 5 GB
    };
    return limits[plan] || 1024;
  }

  async getSubscriptionPlanCounts(): Promise<{ plan: string; count: number }[]> {
    const result = await db
      .select({
        plan: userPlans.plan,
        count: count(),
      })
      .from(userPlans)
      .groupBy(userPlans.plan);
    return result.map(r => ({ plan: r.plan || 'unknown', count: Number(r.count) }));
  }

  // QR Code operations
  async getQRCode(memoryId: string): Promise<QRCode | undefined> {
    const result = await db.select().from(qrCodes).where(eq(qrCodes.memoryId, memoryId)).limit(1);
    return result[0];
  }

  async createQRCode(insertQR: InsertQRCode): Promise<QRCode> {
    const result = await db.insert(qrCodes).values(insertQR).returning();
    return result[0];
  }

  async deleteQRCode(memoryId: string): Promise<boolean> {
    const result = await db.delete(qrCodes).where(eq(qrCodes.memoryId, memoryId)).returning();
    return result.length > 0;
  }

  // Password Reset Token operations
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const result = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();
    return result[0];
  }

  async getValidPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    
    const resetToken = result[0];
    if (resetToken && resetToken.usedAt) {
      return undefined;
    }
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Book Page operations
  async getBookPages(bookId: string): Promise<BookPage[]> {
    return db.select().from(bookPages).where(eq(bookPages.bookId, bookId)).orderBy(asc(bookPages.pageIndex));
  }

  async saveBookPages(bookId: string, pages: InsertBookPage[]): Promise<BookPage[]> {
    // Delete existing pages for this book first
    await db.delete(bookPages).where(eq(bookPages.bookId, bookId));
    
    if (pages.length === 0) {
      return [];
    }
    
    // Insert new pages with correct book ID and page index
    const pagesWithBookId = pages.map((page, index) => ({
      ...page,
      bookId,
      pageIndex: index,
    }));
    
    const result = await db.insert(bookPages).values(pagesWithBookId).returning();
    return result;
  }

  async deleteBookPages(bookId: string): Promise<boolean> {
    const result = await db.delete(bookPages).where(eq(bookPages.bookId, bookId)).returning();
    return result.length > 0;
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.triggerDate));
  }

  async getActiveNotifications(userId: string): Promise<Notification[]> {
    const now = new Date();
    return db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isDismissed, false),
          lte(notifications.triggerDate, now)
        )
      )
      .orderBy(desc(notifications.triggerDate));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const now = new Date();
    const result = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          eq(notifications.isDismissed, false),
          lte(notifications.triggerDate, now)
        )
      );
    return result.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async createManyNotifications(notificationsList: InsertNotification[]): Promise<Notification[]> {
    if (notificationsList.length === 0) return [];
    const result = await db.insert(notifications).values(notificationsList).returning();
    return result;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async dismissNotification(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isDismissed: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  async deleteNotificationsByBookId(bookId: string): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.bookId, bookId)).returning();
    return result.length > 0;
  }

  // Notification Settings operations
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    const result = await db.select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1);
    return result[0];
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const result = await db.insert(notificationSettings).values(settings).returning();
    return result[0];
  }

  async updateNotificationSettings(userId: string, updateData: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const result = await db.update(notificationSettings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(notificationSettings.userId, userId))
      .returning();
    return result[0];
  }

  // Book Template operations
  async getBookTemplates(): Promise<BookTemplate[]> {
    return db.select()
      .from(bookTemplates)
      .where(eq(bookTemplates.isActive, true))
      .orderBy(asc(bookTemplates.sortOrder));
  }

  async getBookTemplateBySlug(slug: string): Promise<BookTemplate | undefined> {
    const result = await db.select()
      .from(bookTemplates)
      .where(eq(bookTemplates.slug, slug))
      .limit(1);
    return result[0];
  }

  async getTemplateSections(templateId: string): Promise<TemplateSection[]> {
    return db.select()
      .from(templateSections)
      .where(eq(templateSections.templateId, templateId))
      .orderBy(asc(templateSections.orderIndex));
  }

  async createBookTemplate(template: InsertBookTemplate): Promise<BookTemplate> {
    const result = await db.insert(bookTemplates).values(template).returning();
    return result[0];
  }

  async createTemplateSection(section: InsertTemplateSection): Promise<TemplateSection> {
    const result = await db.insert(templateSections).values(section).returning();
    return result[0];
  }

  async createBookWithTemplate(
    userId: string, 
    bookData: InsertBook, 
    templateSlug: string, 
    birthDate?: Date
  ): Promise<{ book: Book; pages: BookPage[] }> {
    // Get template first (outside transaction for validation)
    const template = await this.getBookTemplateBySlug(templateSlug);
    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`);
    }

    // Get template sections
    const sections = await this.getTemplateSections(template.id);

    // Use a transaction to ensure atomic book + pages creation
    const referenceDate = birthDate || bookData.birthDate || new Date();
    
    // Create book with template reference
    const [book] = await db.insert(books).values({
      ...bookData,
      userId,
      bookType: 'prebuilt',
      templateSlug,
    }).returning();

    // Convert template sections to book pages with deterministic ordering
    const pagesData: InsertBookPage[] = sections
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((section, index) => {
        let pageDate = '';
        if (section.dateOffsetDays !== null) {
          const date = new Date(referenceDate);
          date.setDate(date.getDate() + section.dateOffsetDays);
          pageDate = date.toISOString().split('T')[0];
        }

        return {
          bookId: book.id,
          pageIndex: index,
          title: section.titleFr,
          subtitle: section.subtitleFr || '',
          date: pageDate,
          description: section.descriptionFr || '',
          layoutStyle: section.layoutStyle || 'single',
          images: section.placeholderImages || [],
          content: section.defaultContent || {},
          backgroundImage: section.backgroundImage,
        };
      });

    // Insert all pages in a single batch
    let savedPages: BookPage[] = [];
    if (pagesData.length > 0) {
      savedPages = await db.insert(bookPages).values(pagesData).returning();
      savedPages.sort((a, b) => a.pageIndex - b.pageIndex);
    }

    // Also create UserBookPages from template pages (filtered by babyStatus)
    await this.createUserBookPagesFromTemplate(book.id, template.id, bookData.babyStatus || undefined);

    return { book, pages: savedPages };
  }

  // Template Parts & Pages operations
  async getTemplateParts(templateId: string): Promise<TemplatePart[]> {
    return db.select()
      .from(templateParts)
      .where(eq(templateParts.templateId, templateId))
      .orderBy(asc(templateParts.partNumber));
  }

  async getTemplatePages(templateId: string): Promise<TemplatePage[]> {
    return db.select()
      .from(templatePages)
      .where(eq(templatePages.templateId, templateId))
      .orderBy(asc(templatePages.pageNumber));
  }

  async getTemplatePagesByPart(partId: string): Promise<TemplatePage[]> {
    return db.select()
      .from(templatePages)
      .where(eq(templatePages.partId, partId))
      .orderBy(asc(templatePages.pageNumber));
  }

  // User Book Pages operations
  async getUserBookPages(bookId: string): Promise<UserBookPage[]> {
    return db.select()
      .from(userBookPages)
      .where(eq(userBookPages.bookId, bookId))
      .orderBy(asc(userBookPages.pageNumber));
  }

  async getUserBookPage(bookId: string, pageNumber: number): Promise<UserBookPage | undefined> {
    const result = await db.select()
      .from(userBookPages)
      .where(
        and(
          eq(userBookPages.bookId, bookId),
          eq(userBookPages.pageNumber, pageNumber)
        )
      )
      .limit(1);
    return result[0];
  }

  async createUserBookPage(page: InsertUserBookPage): Promise<UserBookPage> {
    const result = await db.insert(userBookPages).values(page).returning();
    return result[0];
  }

  async updateUserBookPage(id: string, data: Partial<InsertUserBookPage>): Promise<UserBookPage | undefined> {
    const result = await db.update(userBookPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userBookPages.id, id))
      .returning();
    return result[0];
  }

  async createUserBookPagesFromTemplate(bookId: string, templateId: string, babyStatus?: string): Promise<UserBookPage[]> {
    // Get all template pages
    const allPages = await this.getTemplatePages(templateId);
    
    if (allPages.length === 0) {
      return [];
    }

    // Get the template to check its slug
    const template = await db.select().from(bookTemplates).where(eq(bookTemplates.id, templateId)).limit(1);
    const templateSlug = template[0]?.slug;

    // Get template parts to filter by part number
    const parts = await this.getTemplateParts(templateId);
    const partNumberMap = new Map(parts.map(p => [p.id, p.partNumber]));
    
    // Filter pages based on babyStatus - only for pregnancy template
    // For "born" using pregnancy template: exclude sections 2, 3, 4, 5 (pregnancy sections)
    // For "adoption" using adoption template: include all sections (dedicated template)
    // For "expecting": include all sections
    let pages = allPages;
    if (babyStatus === 'born' && templateSlug === 'prebuilt_pregnancy') {
      const excludedPartNumbers = [2, 3, 4, 5]; // Pregnancy-related sections
      pages = allPages.filter(page => {
        if (!page.partId) return true; // Pages without partId are included
        const partNumber = partNumberMap.get(page.partId);
        if (partNumber === undefined) return true; // Unknown parts are included
        return !excludedPartNumbers.includes(partNumber);
      });
    }
    // Note: adoption books using prebuilt_adoption template get all pages (no filtering needed)

    // Create user book pages for each template page
    const userPages: InsertUserBookPage[] = pages.map(page => ({
      bookId,
      templatePageId: page.id,
      pageNumber: page.pageNumber,
      textContent: [],
      photos: [],
      customData: {},
      isCompleted: false,
    }));

    const result = await db.insert(userBookPages).values(userPages).returning();
    return result.sort((a, b) => a.pageNumber - b.pageNumber);
  }

  async markPageAsCompleted(id: string): Promise<UserBookPage | undefined> {
    const result = await db.update(userBookPages)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(userBookPages.id, id))
      .returning();
    return result[0];
  }

  async addInspirationPage(bookId: string, pageData: Partial<InsertUserBookPage>): Promise<UserBookPage> {
    const insertData: InsertUserBookPage = {
      bookId,
      pageNumber: pageData.pageNumber || 1,
      titleOverride: pageData.titleOverride || null,
      textContent: pageData.textContent || [],
      photos: pageData.photos || [],
      customData: pageData.customData || {},
      isCompleted: false,
    };
    
    const result = await db.insert(userBookPages).values(insertData).returning();
    return result[0];
  }

  async deleteInspirationPage(pageId: string): Promise<boolean> {
    const result = await db.delete(userBookPages).where(eq(userBookPages.id, pageId)).returning();
    return result.length > 0;
  }

  // Media File operations (S3)
  async createMediaFile(media: InsertMediaFile): Promise<MediaFile> {
    const result = await db.insert(mediaFiles).values(media).returning();
    return result[0];
  }

  async getMediaFile(id: string): Promise<MediaFile | undefined> {
    const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
    return result[0];
  }

  async getMediaFileByKey(s3Key: string): Promise<MediaFile | undefined> {
    const result = await db.select().from(mediaFiles).where(eq(mediaFiles.s3Key, s3Key)).limit(1);
    return result[0];
  }

  async getMediaFilesByUser(userId: string): Promise<MediaFile[]> {
    return db.select().from(mediaFiles)
      .where(eq(mediaFiles.userId, userId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async getMediaFilesByBook(bookId: string): Promise<MediaFile[]> {
    return db.select().from(mediaFiles)
      .where(eq(mediaFiles.bookId, bookId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async updateMediaFileStatus(id: string, status: string, uploadedAt?: Date): Promise<MediaFile | undefined> {
    const updateData: any = { status };
    if (uploadedAt) {
      updateData.uploadedAt = uploadedAt;
    }
    const result = await db.update(mediaFiles)
      .set(updateData)
      .where(eq(mediaFiles.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaFile(id: string): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id)).returning();
    return result.length > 0;
  }

  async getUserStorageUsed(userId: string): Promise<number> {
    const result = await db.select({
      total: sum(mediaFiles.size)
    })
      .from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.userId, userId),
          eq(mediaFiles.status, "uploaded")
        )
      );
    return parseInt(result[0]?.total || "0", 10);
  }

  // Subscription operations
  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return result[0];
  }

  async getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return result[0];
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values(subscription).returning();
    return result[0];
  }

  async updateSubscription(userId: string, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return result[0];
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    return result[0];
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStripeSessionId(sessionId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.stripeSessionId, sessionId));
  }

  async getOrdersByPaymentIntentId(paymentIntentId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId));
  }

  async getAllOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async updateOrder(id: string, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async getOrdersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(orders);
    return result[0]?.count || 0;
  }

  async getOrdersCountByStatus(): Promise<Record<string, number>> {
    const result = await db.select({
      status: orders.status,
      count: count()
    }).from(orders).groupBy(orders.status);
    
    const counts: Record<string, number> = {};
    result.forEach(r => {
      counts[r.status] = r.count;
    });
    return counts;
  }

  // Order Events operations
  async getOrderEvents(orderId: string): Promise<OrderEvent[]> {
    return db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(desc(orderEvents.createdAt));
  }

  async createOrderEvent(event: InsertOrderEvent): Promise<OrderEvent> {
    const result = await db.insert(orderEvents).values(event).returning();
    return result[0];
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set(data)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  // PDF Export operations
  async getPdfExport(id: string): Promise<PdfExport | undefined> {
    const result = await db.select().from(pdfExports).where(eq(pdfExports.id, id)).limit(1);
    return result[0];
  }

  async getPdfExportsByBook(bookId: string): Promise<PdfExport[]> {
    return db.select().from(pdfExports).where(eq(pdfExports.bookId, bookId)).orderBy(desc(pdfExports.createdAt));
  }

  async getAllPdfExports(limit: number = 50, offset: number = 0): Promise<PdfExport[]> {
    return db.select().from(pdfExports).orderBy(desc(pdfExports.createdAt)).limit(limit).offset(offset);
  }

  async createPdfExport(pdfExport: InsertPdfExport): Promise<PdfExport> {
    const result = await db.insert(pdfExports).values(pdfExport).returning();
    return result[0];
  }

  async updatePdfExport(id: string, data: Partial<InsertPdfExport>): Promise<PdfExport | undefined> {
    const result = await db.update(pdfExports)
      .set(data)
      .where(eq(pdfExports.id, id))
      .returning();
    return result[0];
  }

  // Admin operations
  async getAdminUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "admin")).orderBy(users.fullName);
  }

  async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  }

  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }

  async setUserRole(userId: string, role: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async createAdminActivityLog(log: InsertAdminActivityLog): Promise<AdminActivityLog> {
    const result = await db.insert(adminActivityLogs).values(log).returning();
    return result[0];
  }

  async getAdminActivityLogs(adminId?: string, limit: number = 100): Promise<AdminActivityLog[]> {
    if (adminId) {
      return db.select().from(adminActivityLogs)
        .where(eq(adminActivityLogs.adminId, adminId))
        .orderBy(desc(adminActivityLogs.createdAt))
        .limit(limit);
    }
    return db.select().from(adminActivityLogs)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit);
  }

  // Admin statistics
  async getSubscriptionStats(): Promise<{ plan: string; count: number }[]> {
    const result = await db.select({
      plan: subscriptions.plan,
      count: count()
    }).from(subscriptions).groupBy(subscriptions.plan);
    
    return result.map(r => ({ plan: r.plan, count: r.count }));
  }

  async getOrderStats(): Promise<{ status: string; count: number; totalAmount: number }[]> {
    const result = await db.select({
      status: orders.status,
      count: count(),
      totalAmount: sum(orders.totalAmount)
    }).from(orders).groupBy(orders.status);
    
    return result.map(r => ({
      status: r.status,
      count: r.count,
      totalAmount: parseInt(r.totalAmount || "0", 10)
    }));
  }

  async getRevenueStats(days: number): Promise<{ date: string; amount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.select({
      date: sql<string>`DATE(${payments.createdAt})`,
      amount: sum(payments.amount)
    })
      .from(payments)
      .where(
        and(
          eq(payments.status, "succeeded"),
          gt(payments.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${payments.createdAt})`)
      .orderBy(sql`DATE(${payments.createdAt})`);
    
    return result.map(r => ({
      date: r.date,
      amount: parseInt(r.amount || "0", 10)
    }));
  }

  // Analytics: Gender statistics
  async getGenderStats(): Promise<{ labels: string[]; values: number[] }> {
    const result = await db.select({
      gender: users.gender,
      count: count()
    })
      .from(users)
      .groupBy(users.gender);
    
    const genderLabels: Record<string, string> = {
      "female": "Femme",
      "male": "Homme",
      "non-binary": "Non-binaire",
      "prefer_not_to_say": "Préfère ne pas répondre",
      "other": "Autre"
    };
    
    const labels: string[] = [];
    const values: number[] = [];
    
    result.forEach(r => {
      const label = r.gender ? (genderLabels[r.gender] || r.gender) : "Non spécifié";
      labels.push(label);
      values.push(r.count);
    });
    
    return { labels, values };
  }

  // Analytics: Region statistics (based on country and shipping city)
  async getRegionStats(): Promise<{ labels: string[]; values: number[] }> {
    // First try to get stats from order shipping cities, then fall back to user countries
    const shippingResult = await db.select({
      city: orders.shippingCity,
      count: count()
    })
      .from(orders)
      .where(sql`${orders.shippingCity} IS NOT NULL AND ${orders.shippingCity} != ''`)
      .groupBy(orders.shippingCity)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
    
    if (shippingResult.length > 0) {
      return {
        labels: shippingResult.map(r => r.city || "Inconnu"),
        values: shippingResult.map(r => r.count)
      };
    }
    
    // Fall back to user countries
    const countryResult = await db.select({
      country: users.country,
      count: count()
    })
      .from(users)
      .where(sql`${users.country} IS NOT NULL AND ${users.country} != ''`)
      .groupBy(users.country)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
    
    return {
      labels: countryResult.map(r => r.country || "Non spécifié"),
      values: countryResult.map(r => r.count)
    };
  }

  // Analytics: Product type statistics
  async getProductStats(): Promise<{ labels: string[]; values: number[] }> {
    const result = await db.select({
      productType: orders.productType,
      count: count()
    })
      .from(orders)
      .groupBy(orders.productType);
    
    const productLabels: Record<string, string> = {
      "softcover": "Couverture souple",
      "hardcover": "Couverture rigide",
      "ebook": "E-book"
    };
    
    const labels: string[] = [];
    const values: number[] = [];
    
    result.forEach(r => {
      const label = r.productType ? (productLabels[r.productType] || r.productType) : "Non spécifié";
      labels.push(label);
      values.push(r.count);
    });
    
    return { labels, values };
  }

  // Email campaigns
  async getEmailCampaigns(limit: number = 50, offset: number = 0): Promise<EmailCampaign[]> {
    return await db.select()
      .from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id)).limit(1);
    return result[0];
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const result = await db.insert(emailCampaigns).values(campaign).returning();
    return result[0];
  }

  async updateEmailCampaign(id: string, data: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const result = await db.update(emailCampaigns)
      .set(data)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return result[0];
  }

  async getUserEmailsByFilter(filter: string): Promise<{ id: string; email: string; fullName: string | null }[]> {
    let result: { id: string; email: string | null; fullName: string | null }[];

    if (filter === 'premium') {
      result = await db.selectDistinct({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      }).from(users)
        .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
        .where(and(
          sql`${users.email} IS NOT NULL AND ${users.email} != ''`,
          eq(subscriptions.plan, 'premium')
        ));
    } else if (filter === 'platine') {
      result = await db.selectDistinct({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      }).from(users)
        .innerJoin(subscriptions, eq(users.id, subscriptions.userId))
        .where(and(
          sql`${users.email} IS NOT NULL AND ${users.email} != ''`,
          eq(subscriptions.plan, 'platine')
        ));
    } else {
      result = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      }).from(users).where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`);
    }

    // Deduplicate by email to avoid sending duplicates
    const seenEmails = new Set<string>();
    return result
      .filter(r => {
        if (!r.email || seenEmails.has(r.email.toLowerCase())) return false;
        seenEmails.add(r.email.toLowerCase());
        return true;
      })
      .map(r => ({
        id: r.id,
        email: r.email || '',
        fullName: r.fullName
      }));
  }

  // Get users who need subscription reminder (14+ days old, no reminder sent yet, no paid subscription)
  async getUsersNeedingSubscriptionReminder(): Promise<User[]> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    // Get users created 14+ days ago who haven't received a reminder
    const result = await db.select()
      .from(users)
      .where(
        and(
          lt(users.createdAt, fourteenDaysAgo),
          isNull(users.subscriptionReminderSentAt)
        )
      );
    
    return result;
  }

  async updateUserSubscriptionReminder(userId: string): Promise<void> {
    await db.update(users)
      .set({ subscriptionReminderSentAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Subscription Discount operations
  async createSubscriptionDiscount(discount: InsertSubscriptionDiscount): Promise<SubscriptionDiscount> {
    const result = await db.insert(subscriptionDiscounts).values(discount).returning();
    return result[0];
  }

  async getSubscriptionDiscount(id: string): Promise<SubscriptionDiscount | undefined> {
    const result = await db.select().from(subscriptionDiscounts).where(eq(subscriptionDiscounts.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionDiscounts(activeOnly: boolean = false): Promise<SubscriptionDiscount[]> {
    if (activeOnly) {
      return await db.select()
        .from(subscriptionDiscounts)
        .where(eq(subscriptionDiscounts.isActive, true))
        .orderBy(desc(subscriptionDiscounts.createdAt));
    }
    return await db.select()
      .from(subscriptionDiscounts)
      .orderBy(desc(subscriptionDiscounts.createdAt));
  }

  async updateSubscriptionDiscount(id: string, data: Partial<InsertSubscriptionDiscount>): Promise<SubscriptionDiscount | undefined> {
    const result = await db.update(subscriptionDiscounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptionDiscounts.id, id))
      .returning();
    return result[0];
  }

  async deleteSubscriptionDiscount(id: string): Promise<boolean> {
    const result = await db.delete(subscriptionDiscounts)
      .where(eq(subscriptionDiscounts.id, id))
      .returning();
    return result.length > 0;
  }

  // User Subscription Discount operations
  async applyDiscountToUser(data: InsertUserSubscriptionDiscount): Promise<UserSubscriptionDiscount> {
    const result = await db.insert(userSubscriptionDiscounts).values(data).returning();
    await db.update(subscriptionDiscounts)
      .set({ redemptionCount: sql`redemption_count + 1` })
      .where(eq(subscriptionDiscounts.id, data.discountId));
    return result[0];
  }

  async getUserDiscounts(userId: string): Promise<UserSubscriptionDiscount[]> {
    return await db.select()
      .from(userSubscriptionDiscounts)
      .where(eq(userSubscriptionDiscounts.userId, userId))
      .orderBy(desc(userSubscriptionDiscounts.appliedAt));
  }

  async getUserActiveDiscounts(userId: string): Promise<(UserSubscriptionDiscount & { discount: SubscriptionDiscount })[]> {
    const result = await db.select({
      userDiscount: userSubscriptionDiscounts,
      discount: subscriptionDiscounts,
    })
      .from(userSubscriptionDiscounts)
      .innerJoin(subscriptionDiscounts, eq(userSubscriptionDiscounts.discountId, subscriptionDiscounts.id))
      .where(
        and(
          eq(userSubscriptionDiscounts.userId, userId),
          eq(userSubscriptionDiscounts.isActive, true),
          or(
            isNull(userSubscriptionDiscounts.expiresAt),
            gt(userSubscriptionDiscounts.expiresAt, new Date())
          )
        )
      );
    return result.map(r => ({ ...r.userDiscount, discount: r.discount }));
  }

  async removeUserDiscount(id: string): Promise<boolean> {
    const result = await db.update(userSubscriptionDiscounts)
      .set({ isActive: false })
      .where(eq(userSubscriptionDiscounts.id, id))
      .returning();
    return result.length > 0;
  }

  // Subscription Plan History operations
  async createPlanHistory(history: InsertSubscriptionPlanHistory): Promise<SubscriptionPlanHistory> {
    const result = await db.insert(subscriptionPlanHistory).values(history).returning();
    return result[0];
  }

  async getUserPlanHistory(userId: string): Promise<SubscriptionPlanHistory[]> {
    return await db.select()
      .from(subscriptionPlanHistory)
      .where(eq(subscriptionPlanHistory.userId, userId))
      .orderBy(desc(subscriptionPlanHistory.createdAt));
  }

  // Admin subscription management
  async getUsersWithSubscriptionDetails(limit: number = 50, offset: number = 0, filter?: string): Promise<any[]> {
    let query = db.select({
      user: users,
      subscription: subscriptions,
      userPlan: userPlans,
    })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(userPlans, eq(users.id, userPlans.userId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await query;
    
    const usersWithDetails = await Promise.all(result.map(async (r) => {
      const activeDiscounts = await this.getUserActiveDiscounts(r.user.id);
      const paymentsResult = await db.select()
        .from(payments)
        .where(eq(payments.userId, r.user.id))
        .orderBy(desc(payments.createdAt))
        .limit(5);
      
      return {
        ...r.user,
        subscription: r.subscription,
        userPlan: r.userPlan,
        activeDiscounts,
        recentPayments: paymentsResult,
      };
    }));

    if (filter) {
      return usersWithDetails.filter(u => {
        if (filter === 'premium') return u.userPlan?.plan === 'premium';
        if (filter === 'platine') return u.userPlan?.plan === 'platine';
        if (filter === 'free') return u.userPlan?.plan === 'free' || !u.userPlan;
        if (filter === 'active') return u.subscription?.status === 'active';
        if (filter === 'canceled') return u.subscription?.status === 'canceled';
        return true;
      });
    }

    return usersWithDetails;
  }

  async getUserSubscriptionDetails(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const [subscription, userPlan, planHistory, activeDiscounts, allDiscounts, userPayments] = await Promise.all([
      this.getSubscription(userId),
      this.getUserPlan(userId),
      this.getUserPlanHistory(userId),
      this.getUserActiveDiscounts(userId),
      this.getUserDiscounts(userId),
      db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)),
    ]);

    const subscriptionStartDate = subscription?.currentPeriodStart || userPlan?.createdAt;
    const monthsElapsed = subscriptionStartDate 
      ? Math.floor((Date.now() - new Date(subscriptionStartDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
      : 0;

    return {
      user,
      subscription,
      userPlan,
      planHistory,
      activeDiscounts,
      allDiscounts,
      payments: userPayments,
      subscriptionStartDate,
      monthsElapsed,
      status: subscription?.status || (userPlan ? 'active' : 'none'),
    };
  }

  // Book Invitation operations
  async createBookInvitation(data: { bookId: string; invitedByUserId: string; email: string; role: string; token: string; expiresAt: Date }): Promise<BookInvitation> {
    const result = await db.insert(bookInvitations).values({
      bookId: data.bookId,
      invitedByUserId: data.invitedByUserId,
      email: data.email,
      role: data.role,
      token: data.token,
      status: 'pending',
      expiresAt: data.expiresAt,
    }).returning();
    return result[0];
  }

  async getBookInvitationByToken(token: string): Promise<BookInvitation | undefined> {
    const result = await db.select().from(bookInvitations).where(eq(bookInvitations.token, token)).limit(1);
    return result[0];
  }

  async getBookInvitationsByBook(bookId: string): Promise<BookInvitation[]> {
    return await db.select().from(bookInvitations).where(eq(bookInvitations.bookId, bookId)).orderBy(desc(bookInvitations.createdAt));
  }

  async updateBookInvitation(id: string, data: Partial<{ status: string; acceptedByUserId: string; acceptedAt: Date }>): Promise<BookInvitation | undefined> {
    const result = await db.update(bookInvitations).set(data).where(eq(bookInvitations.id, id)).returning();
    return result[0];
  }

  // Book Collaborator operations
  async createBookCollaborator(data: { bookId: string; userId: string; role: string; addedByUserId: string }): Promise<BookCollaborator> {
    const result = await db.insert(bookCollaborators).values({
      bookId: data.bookId,
      userId: data.userId,
      role: data.role,
      addedByUserId: data.addedByUserId,
    }).returning();
    return result[0];
  }

  async getBookCollaborators(bookId: string): Promise<(BookCollaborator & { user: User })[]> {
    const result = await db.select({
      collaborator: bookCollaborators,
      user: users,
    })
      .from(bookCollaborators)
      .innerJoin(users, eq(bookCollaborators.userId, users.id))
      .where(eq(bookCollaborators.bookId, bookId))
      .orderBy(desc(bookCollaborators.createdAt));
    
    return result.map(r => ({
      ...r.collaborator,
      user: r.user,
    }));
  }

  async getBookCollaborator(bookId: string, userId: string): Promise<BookCollaborator | undefined> {
    const result = await db.select().from(bookCollaborators)
      .where(and(eq(bookCollaborators.bookId, bookId), eq(bookCollaborators.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getBooksSharedWithUser(userId: string): Promise<(BookCollaborator & { book: Book })[]> {
    const result = await db.select({
      collaborator: bookCollaborators,
      book: books,
    })
      .from(bookCollaborators)
      .innerJoin(books, eq(bookCollaborators.bookId, books.id))
      .where(eq(bookCollaborators.userId, userId))
      .orderBy(desc(bookCollaborators.createdAt));
    
    return result.map(r => ({
      ...r.collaborator,
      book: r.book,
    }));
  }

  async removeBookCollaborator(id: string): Promise<boolean> {
    const result = await db.delete(bookCollaborators).where(eq(bookCollaborators.id, id)).returning();
    return result.length > 0;
  }

  // Gift Certificate operations
  async createGiftCertificate(data: InsertGiftCertificate): Promise<GiftCertificate> {
    const result = await db.insert(giftCertificates).values(data).returning();
    return result[0];
  }

  async getGiftCertificate(id: string): Promise<GiftCertificate | undefined> {
    const result = await db.select().from(giftCertificates).where(eq(giftCertificates.id, id)).limit(1);
    return result[0];
  }

  async getGiftCertificateByCode(code: string): Promise<GiftCertificate | undefined> {
    const result = await db.select().from(giftCertificates).where(eq(giftCertificates.code, code)).limit(1);
    return result[0];
  }

  async getGiftCertificateByStripeSession(sessionId: string): Promise<GiftCertificate | undefined> {
    const result = await db.select().from(giftCertificates).where(eq(giftCertificates.stripeSessionId, sessionId)).limit(1);
    return result[0];
  }

  async updateGiftCertificate(id: string, data: Partial<InsertGiftCertificate>): Promise<GiftCertificate | undefined> {
    const result = await db.update(giftCertificates).set(data).where(eq(giftCertificates.id, id)).returning();
    return result[0];
  }

  async getAllGiftCertificates(): Promise<GiftCertificate[]> {
    return await db.select().from(giftCertificates).orderBy(desc(giftCertificates.createdAt));
  }

  async getGiftCertificateStats(): Promise<{ total: number; pending: number; paid: number; redeemed: number; totalRevenue: number }> {
    const all = await db.select().from(giftCertificates);
    const pending = all.filter(g => g.status === 'pending').length;
    const paid = all.filter(g => ['paid', 'sent'].includes(g.status)).length;
    const redeemed = all.filter(g => g.status === 'redeemed').length;
    const totalRevenue = all.filter(g => g.status !== 'pending' && g.status !== 'refunded').reduce((sum, g) => sum + g.amount, 0);
    return { total: all.length, pending, paid, redeemed, totalRevenue };
  }
}

export const storage = new DatabaseStorage();
