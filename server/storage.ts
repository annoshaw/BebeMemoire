import { db } from "./db";
import { users, books, memories, userPlans, qrCodes, passwordResetTokens, bookPages, notifications, notificationSettings, bookTemplates, templateSections, templateParts, templatePages, userBookPages, mediaFiles, type User, type InsertUser, type UpsertUser, type Book, type InsertBook, type Memory, type InsertMemory, type UserPlan, type InsertUserPlan, type QRCode, type InsertQRCode, type PasswordResetToken, type InsertPasswordResetToken, type BookPage, type InsertBookPage, type Notification, type InsertNotification, type NotificationSettings, type InsertNotificationSettings, type BookTemplate, type InsertBookTemplate, type TemplateSection, type InsertTemplateSection, type TemplatePart, type InsertTemplatePart, type TemplatePage, type InsertTemplatePage, type UserBookPage, type InsertUserBookPage, type MediaFile, type InsertMediaFile } from "@shared/schema";
import { eq, desc, and, gt, asc, lte, or, isNull, sum } from "drizzle-orm";

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

    // Get template parts to filter by part number
    const parts = await this.getTemplateParts(templateId);
    const partNumberMap = new Map(parts.map(p => [p.id, p.partNumber]));
    
    // Filter pages based on babyStatus
    // For "born" or "adoption": exclude sections 2, 3, 4, 5 (pregnancy sections)
    // For "expecting": include all sections
    let pages = allPages;
    if (babyStatus === 'born' || babyStatus === 'adoption') {
      const excludedPartNumbers = [2, 3, 4, 5]; // Pregnancy-related sections
      pages = allPages.filter(page => {
        if (!page.partId) return true; // Pages without partId are included
        const partNumber = partNumberMap.get(page.partId);
        if (partNumber === undefined) return true; // Unknown parts are included
        return !excludedPartNumbers.includes(partNumber);
      });
    }

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
}

export const storage = new DatabaseStorage();
