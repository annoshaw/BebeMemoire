import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertBookSchema, insertMemorySchema, type User } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import express from "express";
import path from "path";
import fs from "fs";
import { generateUploadUrl, generateDownloadUrl, deleteFile, generateMediaKey, isS3Configured } from "./s3";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id?: string;
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

// Authentication middleware that works with both Replit Auth and email/password
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  const user = req.user as any;
  const userId = user.claims?.sub || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  (req as any).userId = userId;
  next();
}

// Admin middleware - requires user to have admin role
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  const user = req.user as any;
  const userId = user.claims?.sub || user.id;
  if (!userId) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  
  // Check if user has admin role
  const dbUser = await storage.getUser(userId);
  if (!dbUser || dbUser.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé - Droits administrateur requis" });
  }
  
  (req as any).userId = userId;
  (req as any).isAdmin = true;
  next();
}

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MEM-${year}${month}-${random}`;
}

// Valid product types and order statuses
const VALID_PRODUCT_TYPES = ["softcover", "hardcover", "ebook"] as const;
const VALID_ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped", "refunded"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

// Zod schema for order creation
import { z } from "zod";
const createOrderSchema = z.object({
  bookId: z.string().min(1),
  productType: z.enum(VALID_PRODUCT_TYPES),
  printOptions: z.object({
    coverType: z.enum(["soft", "hard"]).optional(),
    finish: z.enum(["matte", "glossy"]).optional(),
    paperQuality: z.enum(["standard", "premium"]).optional(),
  }).optional().nullable(),
  pageCount: z.number().int().positive().min(1),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional().nullable(),
  billingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }).optional().nullable(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(VALID_ORDER_STATUSES).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve Flutter web app from /flutter/ path (works in both dev and production)
  const flutterPath = path.resolve(process.cwd(), "flutter_app", "build", "web");
  if (fs.existsSync(flutterPath)) {
    app.use("/flutter", express.static(flutterPath));
    
    // Handle Flutter SPA routing - all /flutter/* routes serve the Flutter index.html
    app.get("/flutter/*", (_req, res) => {
      res.sendFile(path.resolve(flutterPath, "index.html"));
    });
  }
  
  // Setup Replit Auth (handles session, passport, login/logout/callback routes)
  await setupAuth(app);

  // AUTH ROUTES

  // Register with email/password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, address, gender, phone, country } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: "Adresse email invalide" });
      }
      
      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
      }
      
      if (!fullName || typeof fullName !== 'string' || fullName.length < 2) {
        return res.status(400).json({ message: "Le nom complet est requis" });
      }
      
      const existingUser = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        return res.status(400).json({ message: "Un compte avec cet email existe déjà" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        address: address || null,
        gender: gender || null,
        phone: phone || null,
        country: country || null,
        authProvider: "email",
      });
      
      req.login({ id: user.id } as any, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Erreur lors de la connexion" });
        }
        res.status(201).json({ 
          message: "Compte créé avec succès",
          user: { id: user.id, email: user.email, fullName: user.fullName }
        });
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erreur lors de la création du compte" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou mot de passe incorrect" });
      }
      
      // Extend session duration if "remember me" is checked (30 days vs 1 week)
      if (rememberMe && req.session) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      req.login({ id: user.id } as any, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Erreur lors de la connexion" });
        }
        res.json({ 
          message: "Connexion réussie",
          user: { id: user.id, email: user.email, fullName: user.fullName }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erreur lors de la connexion" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnexion réussie" });
    });
  });

  // Forgot password - Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ message: "Adresse email invalide" });
      }
      
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      // Always return success to prevent email enumeration attacks
      if (!user || user.authProvider !== 'email') {
        return res.json({ 
          message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation." 
        });
      }
      
      // Generate a secure token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
      
      await storage.createPasswordResetToken(user.id, token, expiresAt);
      
      // Build the reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      
      // Send the password reset email
      const { sendPasswordResetEmail } = await import("./emailService");
      const emailSent = await sendPasswordResetEmail({
        email: user.email!,
        fullName: user.fullName,
        resetUrl,
      });
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
      }
      
      res.json({ 
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erreur lors de la demande de réinitialisation" });
    }
  });

  // Reset password - Verify token and update password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Token invalide" });
      }
      
      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères" });
      }
      
      const resetToken = await storage.getValidPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Ce lien de réinitialisation est invalide ou a expiré" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user's password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark the token as used
      await storage.markPasswordResetTokenAsUsed(token);
      
      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe" });
    }
  });

  // Verify reset token (check if token is valid without resetting)
  app.get("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: "Token invalide" });
      }
      
      const resetToken = await storage.getValidPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ valid: false, message: "Ce lien de réinitialisation est invalide ou a expiré" });
      }
      
      res.json({ valid: true });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ valid: false, message: "Erreur lors de la vérification du token" });
    }
  });

  // Get current user (supports both Replit Auth and email/password)
  app.get("/api/auth/user", async (req: any, res: Response) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const user = req.user as any;
      const userId = user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Legacy: Get current user (for backward compatibility)
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Non connecté" });
    }
    res.json({ user: req.user });
  });

  // ONBOARDING ROUTES

  // Get onboarding state
  app.get("/api/onboarding/state", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const books = await storage.getBooksByUserId(userId);
      const notificationSettings = await storage.getNotificationSettings(userId);
      
      res.json({
        onboardingCompleted: user.onboardingCompleted || false,
        hasBooks: books.length > 0,
        firstBook: books.length > 0 ? books[0] : null,
        notificationSettings: notificationSettings || null,
      });
    } catch (error) {
      console.error("Get onboarding state error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'état d'onboarding" });
    }
  });

  // Complete onboarding - creates first book and notification settings
  app.post("/api/onboarding", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { 
        bookType, // 'born', 'expecting', 'adoption'
        childName,
        date, // birth date, due date, or adoption date
        notificationFrequency, // 'daily', 'weekly', 'monthly', 'none'
        babyGender, // optional
      } = req.body;
      
      // Validate required fields
      if (!bookType || !['born', 'expecting', 'adoption'].includes(bookType)) {
        return res.status(400).json({ message: "Type de livre invalide" });
      }
      
      if (!childName || typeof childName !== 'string' || childName.trim().length < 1) {
        return res.status(400).json({ message: "Le nom de l'enfant est requis" });
      }
      
      if (!date) {
        return res.status(400).json({ message: "La date est requise" });
      }
      
      if (!notificationFrequency || !['daily', 'weekly', 'monthly', 'none'].includes(notificationFrequency)) {
        return res.status(400).json({ message: "Fréquence de notification invalide" });
      }
      
      // Parse date
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Date invalide" });
      }
      
      // Create the first book
      const bookData = {
        userId,
        childName: childName.trim(),
        babyStatus: bookType,
        birthDate: parsedDate,
        babyGender: babyGender || null,
        bookType: 'custom' as const,
        isActive: true,
      };
      
      const book = await storage.createBook(bookData);
      
      // Create or update notification settings
      let settings = await storage.getNotificationSettings(userId);
      if (settings) {
        settings = await storage.updateNotificationSettings(userId, {
          notificationFrequency,
          pushNotifications: notificationFrequency !== 'none',
          milestoneReminders: notificationFrequency !== 'none',
        });
      } else {
        settings = await storage.createNotificationSettings({
          userId,
          notificationFrequency,
          pushNotifications: notificationFrequency !== 'none',
          milestoneReminders: notificationFrequency !== 'none',
          emailNotifications: notificationFrequency !== 'none',
        });
      }
      
      // Mark onboarding as completed
      await storage.completeOnboarding(userId);
      
      res.status(201).json({
        message: "Onboarding complété avec succès",
        book,
        notificationSettings: settings,
        onboardingCompleted: true,
      });
    } catch (error) {
      console.error("Complete onboarding error:", error);
      res.status(500).json({ message: "Erreur lors de la complétion de l'onboarding" });
    }
  });

  // Update user profile (gender, country, phone)
  app.patch("/api/auth/user", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { gender, country, phone, fullName } = req.body;
      
      const updateData: any = {};
      if (gender !== undefined) updateData.gender = gender;
      if (country !== undefined) updateData.country = country;
      if (phone !== undefined) updateData.phone = phone;
      if (fullName !== undefined) updateData.fullName = fullName;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
      }
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du profil" });
    }
  });

  // BOOK TEMPLATE ROUTES

  // Get all available book templates (requires auth)
  app.get("/api/book-templates", requireAuth, async (_req: Request, res: Response) => {
    try {
      const templates = await storage.getBookTemplates();
      res.json({ templates });
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des templates" });
    }
  });

  // Get template sections for a specific template (requires auth)
  app.get("/api/book-templates/:slug/sections", requireAuth, async (req: Request, res: Response) => {
    try {
      const template = await storage.getBookTemplateBySlug(req.params.slug);
      if (!template) {
        return res.status(404).json({ message: "Template non trouvé" });
      }
      const sections = await storage.getTemplateSections(template.id);
      res.json({ template, sections });
    } catch (error) {
      console.error("Get template sections error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des sections" });
    }
  });

  // Get template parts and pages for a specific template
  app.get("/api/book-templates/:slug/structure", requireAuth, async (req: Request, res: Response) => {
    try {
      const template = await storage.getBookTemplateBySlug(req.params.slug);
      if (!template) {
        return res.status(404).json({ message: "Template non trouvé" });
      }
      const parts = await storage.getTemplateParts(template.id);
      const pages = await storage.getTemplatePages(template.id);
      res.json({ template, parts, pages });
    } catch (error) {
      console.error("Get template structure error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la structure" });
    }
  });

  // USER BOOK PAGES ROUTES

  // Get all pages for a book (with template info)
  app.get("/api/books/:bookId/pages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const userPages = await storage.getUserBookPages(req.params.bookId);
      
      // Generate fresh video URLs for pages with videoMediaId
      const pagesWithFreshUrls = await Promise.all(
        userPages.map(async (page) => {
          if (page.videoMediaId) {
            const mediaFile = await storage.getMediaFile(page.videoMediaId);
            if (mediaFile && mediaFile.status === 'uploaded') {
              const freshVideoUrl = await generateDownloadUrl(mediaFile.s3Key, 3600);
              return { ...page, videoUrl: freshVideoUrl };
            }
          }
          return page;
        })
      );
      
      // If prebuilt book, get template info
      let template = null;
      let templateParts: any[] | null = null;
      let templatePages: any[] | null = null;
      
      if (book.templateSlug) {
        template = await storage.getBookTemplateBySlug(book.templateSlug);
        if (template) {
          const allParts = await storage.getTemplateParts(template.id);
          const allPages = await storage.getTemplatePages(template.id);
          
          // Filter parts and pages based on babyStatus - only for pregnancy template
          // For "born" using pregnancy template: exclude sections 2, 3, 4, 5 (pregnancy sections)
          // For "adoption" using adoption template: include all sections (dedicated template)
          if (book.babyStatus === 'born' && book.templateSlug === 'prebuilt_pregnancy') {
            const excludedPartNumbers = [2, 3, 4, 5];
            const filteredParts = allParts.filter(part => !excludedPartNumbers.includes(part.partNumber));
            // Renumber parts sequentially (1, 2, 3 instead of 1, 6, 7)
            templateParts = filteredParts.map((part, index) => ({
              ...part,
              partNumber: index + 1, // Renumber to 1, 2, 3
            }));
            const includedPartIds = new Set(filteredParts.map(p => p.id));
            const filteredPages = allPages.filter(page => page.partId === null || includedPartIds.has(page.partId));
            // Add displayPageNumber for sequential numbering (1, 2, 3...)
            templatePages = filteredPages.map((page, index) => ({
              ...page,
              displayPageNumber: index + 1,
            }));
          } else {
            // For expecting books AND adoption books (dedicated template): include all parts
            templateParts = allParts;
            templatePages = allPages.map(page => ({
              ...page,
              displayPageNumber: page.pageNumber,
            }));
          }
        }
      }

      // Add inspiration pages (from userPages with isInspirationPage flag) to templatePages
      const inspirationPages = pagesWithFreshUrls.filter(page => {
        const customData = page.customData as any;
        return customData?.isInspirationPage === true;
      });

      // Create a virtual "Inspiration" part for inspiration pages
      const inspirationPartId = 'inspiration-part';
      
      if (inspirationPages.length > 0 && templatePages) {
        const inspirationTemplatePages = inspirationPages.map(page => {
          const customData = page.customData as any;
          return {
            id: `inspiration-${page.id}`,
            templateId: template?.id || null,
            partId: inspirationPartId, // Link to virtual inspiration part
            pageNumber: page.pageNumber,
            titleFr: customData.titleFr || page.titleOverride || "Page d'inspiration",
            titleEn: customData.titleEn || page.titleOverride || "Inspiration Page",
            subtitleFr: customData.subtitleFr || null,
            subtitleEn: customData.subtitleEn || null,
            promptsFr: customData.promptsFr || [],
            promptsEn: customData.promptsEn || [],
            pageType: customData.pageType || "text_photo",
            layoutStyle: "single",
            maxPhotos: customData.maxPhotos || 4,
            hasVideo: customData.hasVideo ?? true,
            hasTextBlocks: 2,
            iconName: null,
            backgroundImage: null,
            createdAt: page.createdAt,
            isInspirationPage: true,
          };
        });
        
        // Merge and sort by page number, then recalculate displayPageNumber
        const mergedPages = [...templatePages, ...inspirationTemplatePages].sort((a, b) => a.pageNumber - b.pageNumber);
        templatePages = mergedPages.map((page, index) => ({
          ...page,
          displayPageNumber: index + 1,
        }));
        
        // Add virtual Inspiration part at the end
        const nextPartNumber = templateParts ? Math.max(...templateParts.map(p => p.partNumber), 0) + 1 : 1;
        const inspirationPart = {
          id: inspirationPartId,
          templateId: template?.id || null,
          partNumber: nextPartNumber,
          titleFr: "Bonus",
          titleEn: "Bonus",
          descriptionFr: "Pages d'inspiration ajoutées",
          descriptionEn: "Added inspiration pages",
          iconName: "sparkles",
          createdAt: new Date(),
          isInspirationSection: true,
        };
        templateParts = [...(templateParts || []), inspirationPart];
      }

      res.json({ 
        pages: pagesWithFreshUrls,
        template,
        templateParts,
        templatePages,
        book
      });
    } catch (error) {
      console.error("Get book pages error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des pages" });
    }
  });

  // Get a specific page
  app.get("/api/books/:bookId/pages/:pageNumber", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const pageNumber = parseInt(req.params.pageNumber);
      const page = await storage.getUserBookPage(req.params.bookId, pageNumber);
      
      if (!page) {
        return res.status(404).json({ message: "Page non trouvée" });
      }

      res.json({ page });
    } catch (error) {
      console.error("Get page error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la page" });
    }
  });

  // Update a page content
  app.patch("/api/books/:bookId/pages/:pageId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const { textContent, photos, videoUrl, videoMediaId, customData, titleOverride } = req.body;
      
      const updateData: any = {};
      if (textContent !== undefined) updateData.textContent = textContent;
      if (photos !== undefined) updateData.photos = photos;
      // Only accept valid S3 URLs for videos, reject base64 data URLs
      if (videoUrl !== undefined) {
        if (videoUrl === null || videoUrl.startsWith('https://')) {
          updateData.videoUrl = videoUrl;
        } else if (videoUrl.startsWith('data:')) {
          console.warn('Rejecting base64 video URL - videos must be uploaded to S3');
          // Don't update videoUrl if it's a base64 URL
        } else {
          updateData.videoUrl = videoUrl;
        }
      }
      if (videoMediaId !== undefined) updateData.videoMediaId = videoMediaId;
      if (customData !== undefined) updateData.customData = customData;
      if (titleOverride !== undefined) updateData.titleOverride = titleOverride;

      const page = await storage.updateUserBookPage(req.params.pageId, updateData);
      
      if (!page) {
        return res.status(404).json({ message: "Page non trouvée" });
      }

      res.json({ page });
    } catch (error) {
      console.error("Update page error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la page" });
    }
  });

  // Mark a page as completed
  app.post("/api/books/:bookId/pages/:pageId/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const page = await storage.markPageAsCompleted(req.params.pageId);
      
      if (!page) {
        return res.status(404).json({ message: "Page non trouvée" });
      }

      res.json({ page });
    } catch (error) {
      console.error("Complete page error:", error);
      res.status(500).json({ message: "Erreur lors de la complétion de la page" });
    }
  });

  // Initialize book pages from template (used after book creation)
  app.post("/api/books/:bookId/initialize-pages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (!book.templateSlug) {
        return res.status(400).json({ message: "Ce livre n'utilise pas de template" });
      }

      const template = await storage.getBookTemplateBySlug(book.templateSlug);
      if (!template) {
        return res.status(404).json({ message: "Template non trouvé" });
      }

      // Check if pages already exist
      const existingPages = await storage.getUserBookPages(req.params.bookId);
      if (existingPages.length > 0) {
        return res.status(400).json({ message: "Les pages existent déjà pour ce livre" });
      }

      const pages = await storage.createUserBookPagesFromTemplate(req.params.bookId, template.id, book.babyStatus || undefined);
      
      res.status(201).json({ pages, message: "Pages initialisées avec succès" });
    } catch (error) {
      console.error("Initialize pages error:", error);
      res.status(500).json({ message: "Erreur lors de l'initialisation des pages" });
    }
  });

  // Apply style to all pages in a book
  app.post("/api/books/:bookId/apply-style", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const { styleType, titleStyle, textStyle, collageStyle } = req.body;
      
      if (!styleType || !['title', 'description', 'collage'].includes(styleType)) {
        return res.status(400).json({ message: "Type de style invalide" });
      }

      // Get all pages for this book
      const pages = await storage.getUserBookPages(req.params.bookId);
      
      // Get template pages to know which pages support photos
      let templatePagesData: Awaited<ReturnType<typeof storage.getTemplatePages>> = [];
      if (book.templateSlug) {
        const template = await storage.getBookTemplateBySlug(book.templateSlug);
        if (template) {
          templatePagesData = await storage.getTemplatePages(template.id);
        }
      }
      
      // Update each page with the style
      let updatedCount = 0;
      for (const page of pages) {
        const currentCustomData = (page.customData as Record<string, any>) || {};
        
        let updatedCustomData;
        if (styleType === 'title') {
          updatedCustomData = {
            ...currentCustomData,
            titleStyle: titleStyle
          };
          await storage.updateUserBookPage(page.id, { customData: updatedCustomData });
          updatedCount++;
        } else if (styleType === 'description') {
          // Apply description style to all text indices
          const currentTextStyles = currentCustomData.textStyles || {};
          const updatedTextStyles: Record<number, any> = {};
          
          // Apply the style to indices 0, 1, 2 to cover all possible text fields
          for (let i = 0; i < 5; i++) {
            updatedTextStyles[i] = textStyle;
          }
          
          updatedCustomData = {
            ...currentCustomData,
            textStyles: updatedTextStyles
          };
          await storage.updateUserBookPage(page.id, { customData: updatedCustomData });
          updatedCount++;
        } else if (styleType === 'collage') {
          // Apply collage style to all pages that support photos (maxPhotos > 0)
          const templatePage = templatePagesData.find(tp => tp.pageNumber === page.pageNumber);
          if (templatePage && (templatePage.maxPhotos || 0) > 0) {
            updatedCustomData = {
              ...currentCustomData,
              collageStyle: collageStyle
            };
            await storage.updateUserBookPage(page.id, { customData: updatedCustomData });
            updatedCount++;
          }
        }
      }

      res.json({ message: "Style appliqué avec succès", pagesUpdated: pages.length });
    } catch (error) {
      console.error("Apply style error:", error);
      res.status(500).json({ message: "Erreur lors de l'application du style" });
    }
  });

  // BOOK ROUTES

  // Get all books for current user
  app.get("/api/books", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const books = await storage.getBooksByUserId(userId);
      res.json({ books });
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des livres" });
    }
  });

  // Create a new book (supports both custom and template-based)
  app.post("/api/books", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { templateSlug, ...bookData } = req.body;
      
      const validation = insertBookSchema.safeParse({
        ...bookData,
        userId: userId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: fromError(validation.error).toString()
        });
      }

      // Determine templateSlug based on babyStatus - ALWAYS override for prebuilt books
      let effectiveTemplateSlug = templateSlug;
      
      // For prebuilt books, always use the correct template based on babyStatus
      if (validation.data.babyStatus === 'adoption') {
        // Adoption always uses the adoption template
        effectiveTemplateSlug = 'prebuilt_adoption';
      } else if (validation.data.babyStatus && (templateSlug === 'prebuilt_pregnancy' || !templateSlug)) {
        // For 'expecting' and 'born', use the pregnancy template
        effectiveTemplateSlug = 'prebuilt_pregnancy';
      }
      
      console.log("Creating book with babyStatus:", validation.data.babyStatus, "templateSlug:", effectiveTemplateSlug);
      
      // If we have a template slug and it's not 'custom', create book with template
      if (effectiveTemplateSlug && effectiveTemplateSlug !== 'custom') {
        try {
          const result = await storage.createBookWithTemplate(
            userId, 
            validation.data, 
            effectiveTemplateSlug,
            validation.data.birthDate
          );
          res.status(201).json({ book: result.book, pages: result.pages });
        } catch (templateError: any) {
          console.error("Template error:", templateError);
          // Return error instead of silent fallback
          return res.status(400).json({ 
            message: "Erreur lors de l'application du template. Veuillez réessayer." 
          });
        }
      } else {
        // Create regular custom book (empty pages)
        const book = await storage.createBook(validation.data);
        res.status(201).json({ book, pages: [] });
      }
    } catch (error) {
      console.error("Create book error:", error);
      res.status(500).json({ message: "Erreur lors de la création du livre" });
    }
  });

  // Get a specific book
  app.get("/api/books/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      res.json({ book });
    } catch (error) {
      console.error("Get book error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du livre" });
    }
  });

  // Update a book
  app.patch("/api/books/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const updatedBook = await storage.updateBook(req.params.id, req.body);
      res.json({ book: updatedBook });
    } catch (error) {
      console.error("Update book error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du livre" });
    }
  });

  // Delete a book
  app.delete("/api/books/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      await storage.deleteBook(req.params.id);
      res.json({ message: "Livre supprimé avec succès" });
    } catch (error) {
      console.error("Delete book error:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du livre" });
    }
  });

  // Get current age/pregnancy status for a book (dynamic calculation)
  app.get("/api/books/:id/age", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.id);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      if (!book.birthDate) {
        return res.status(400).json({ message: "Date non définie pour ce livre" });
      }
      
      const childName = book.childName || "Bébé";
      let babyStatus = book.babyStatus || "born";
      const now = new Date();
      const dateValue = new Date(book.birthDate);
      const isDateInFuture = dateValue > now;
      const isDateInPast = dateValue <= now;
      
      // Smart status detection based on date reality
      // If marked "born" but date is in future, treat as expecting
      // If marked "expecting" but due date has passed, treat as born
      let effectiveStatus = babyStatus;
      if (babyStatus === "born" && isDateInFuture) {
        effectiveStatus = "expecting";
      } else if (babyStatus === "expecting" && isDateInPast) {
        effectiveStatus = "born";
      }
      
      if (effectiveStatus === "expecting") {
        // Pregnancy progress - birthDate is the due date
        const progress = calculatePregnancyProgress(book.birthDate);
        res.json({
          age: {
            type: "pregnancy",
            message: formatPregnancyMessage(childName, book.birthDate),
            weeksPregnant: progress.weeksPregnant,
            monthsPregnant: progress.monthsPregnant,
            weeksUntilDue: progress.weeksUntilDue,
            daysUntilDue: progress.daysUntilDue,
            trimester: progress.trimester,
            isPastDue: progress.isPastDue,
            childName,
            dueDate: book.birthDate,
            originalStatus: babyStatus,
            effectiveStatus
          }
        });
      } else {
        // Born baby or adoption - calculate age
        const age = calculateExactAge(book.birthDate);
        res.json({
          age: {
            type: babyStatus === "adoption" ? "adoption" : "born",
            message: formatAgeMessage(childName, book.birthDate),
            years: age.years,
            months: age.months,
            days: age.days,
            totalDays: age.totalDays,
            totalWeeks: age.totalWeeks,
            totalMonths: age.totalMonths,
            childName,
            birthDate: book.birthDate,
            originalStatus: babyStatus,
            effectiveStatus
          }
        });
      }
    } catch (error) {
      console.error("Get age error:", error);
      res.status(500).json({ message: "Erreur lors du calcul de l'âge" });
    }
  });

  // MEMORY ROUTES

  // Get all memories for a book
  app.get("/api/books/:bookId/memories", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const memories = await storage.getMemoriesByBookId(req.params.bookId);
      res.json({ memories });
    } catch (error) {
      console.error("Get memories error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des souvenirs" });
    }
  });

  // Create a memory
  app.post("/api/books/:bookId/memories", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const validation = insertMemorySchema.safeParse({
        ...req.body,
        bookId: req.params.bookId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: fromError(validation.error).toString()
        });
      }

      const memory = await storage.createMemory(validation.data);
      res.status(201).json({ memory });
    } catch (error) {
      console.error("Create memory error:", error);
      res.status(500).json({ message: "Erreur lors de la création du souvenir" });
    }
  });

  // Update a memory
  app.patch("/api/memories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const memory = await storage.getMemory(req.params.id);
      if (!memory) {
        return res.status(404).json({ message: "Souvenir non trouvé" });
      }

      const book = await storage.getBook(memory.bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const updatedMemory = await storage.updateMemory(req.params.id, req.body);
      res.json({ memory: updatedMemory });
    } catch (error) {
      console.error("Update memory error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du souvenir" });
    }
  });

  // Delete a memory
  app.delete("/api/memories/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const memory = await storage.getMemory(req.params.id);
      if (!memory) {
        return res.status(404).json({ message: "Souvenir non trouvé" });
      }

      const book = await storage.getBook(memory.bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      await storage.deleteMemory(req.params.id);
      res.json({ message: "Souvenir supprimé avec succès" });
    } catch (error) {
      console.error("Delete memory error:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du souvenir" });
    }
  });

  // BOOK PAGES ROUTES

  // Get all pages for a book
  app.get("/api/books/:bookId/pages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      const pages = await storage.getBookPages(req.params.bookId);
      res.json({ pages });
    } catch (error) {
      console.error("Get book pages error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des pages" });
    }
  });

  // Save all pages for a book
  app.post("/api/books/:bookId/pages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      const { pages } = req.body;
      
      if (!Array.isArray(pages)) {
        return res.status(400).json({ message: "Format de pages invalide" });
      }
      
      const savedPages = await storage.saveBookPages(req.params.bookId, pages);
      res.json({ pages: savedPages, message: "Pages sauvegardées avec succès" });
    } catch (error) {
      console.error("Save book pages error:", error);
      res.status(500).json({ message: "Erreur lors de la sauvegarde des pages" });
    }
  });

  // Add inspiration page to a book
  app.post("/api/books/:bookId/add-inspiration-page", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      const { title, titleEn, subtitle, subtitleEn, pageType, prompts, promptsEn } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Titre requis" });
      }
      
      // Get template pages to find max template page number
      let maxTemplatePageNumber = 0;
      if (book.templateSlug) {
        const template = await storage.getBookTemplateBySlug(book.templateSlug);
        if (template) {
          const templatePagesData = await storage.getTemplatePages(template.id);
          maxTemplatePageNumber = Math.max(...templatePagesData.map(p => p.pageNumber), 0);
        }
      }
      
      // Get existing user pages to find max page number including inspiration pages
      const existingUserPages = await storage.getUserBookPages(req.params.bookId);
      const maxUserPageNumber = Math.max(...existingUserPages.map(p => p.pageNumber), 0);
      
      // New page number is after all existing pages (template + inspiration)
      const newPageNumber = Math.max(maxTemplatePageNumber, maxUserPageNumber) + 1;
      
      // Create new user book page
      const newPage = await storage.addInspirationPage(req.params.bookId, {
        pageNumber: newPageNumber,
        titleOverride: title,
        textContent: [],
        photos: [],
        customData: { 
          isInspirationPage: true, 
          titleFr: title,
          titleEn: titleEn || title,
          subtitleFr: subtitle || "",
          subtitleEn: subtitleEn || subtitle || "",
          pageType: pageType || "text_photo",
          promptsFr: prompts || [],
          promptsEn: promptsEn || prompts || [],
          hasVideo: true,
          maxPhotos: 4
        },
        isCompleted: false,
      });
      
      res.json({ page: newPage, pageNumber: newPageNumber, message: "Page d'inspiration ajoutée avec succès" });
    } catch (error) {
      console.error("Add inspiration page error:", error);
      res.status(500).json({ message: "Erreur lors de l'ajout de la page d'inspiration" });
    }
  });

  // Delete inspiration page from a book
  app.delete("/api/books/:bookId/pages/:pageId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      const deleted = await storage.deleteInspirationPage(req.params.pageId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Page non trouvée" });
      }
      
      res.json({ message: "Page supprimée avec succès" });
    } catch (error) {
      console.error("Delete inspiration page error:", error);
      res.status(500).json({ message: "Erreur lors de la suppression de la page" });
    }
  });

  // NOTIFICATION ROUTES

  // Get all notifications for user
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const notifications = await storage.getActiveNotifications(userId);
      const unreadCount = await storage.getUnreadNotificationsCount(userId);
      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
  });

  // Get unread count
  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
      }
      res.json({ notification });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "Toutes les notifications marquées comme lues" });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // Dismiss notification
  app.patch("/api/notifications/:id/dismiss", requireAuth, async (req: Request, res: Response) => {
    try {
      const notification = await storage.dismissNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification non trouvée" });
      }
      res.json({ notification });
    } catch (error) {
      console.error("Dismiss notification error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // Generate milestone notifications for a book (status-aware)
  app.post("/api/books/:bookId/generate-notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const book = await storage.getBook(req.params.bookId);
      
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (!book.birthDate) {
        return res.status(400).json({ message: "Date requise pour générer les rappels" });
      }

      // Delete existing notifications for this book
      await storage.deleteNotificationsByBookId(req.params.bookId);

      const childName = book.childName || "Bébé";
      const babyStatus = book.babyStatus || "born";
      let notifications: any[] = [];

      if (babyStatus === "born") {
        // Born baby: age-based milestones
        notifications = generateBornMilestones(book.birthDate, childName, req.params.bookId, userId);
      } else if (babyStatus === "expecting") {
        // Expecting: pregnancy countdown until due date
        notifications = generatePregnancyNotifications(book.birthDate, childName, req.params.bookId, userId);
      } else if (babyStatus === "adoption") {
        // Adoption: weekly reminders on chosen weekday
        const adoptionNotifications = generateAdoptionNotifications(book.birthDate, childName, req.params.bookId, userId, book.notificationWeekday);
        if (adoptionNotifications === null) {
          return res.status(400).json({ 
            message: "Veuillez d'abord choisir votre jour de rappel hebdomadaire dans les paramètres du livre" 
          });
        }
        notifications = adoptionNotifications;
      }
      
      if (notifications.length > 0) {
        await storage.createManyNotifications(notifications);
      }

      res.json({ message: `${notifications.length} rappels générés pour ${childName}`, count: notifications.length });
    } catch (error) {
      console.error("Generate notifications error:", error);
      res.status(500).json({ message: "Erreur lors de la génération des rappels" });
    }
  });

  // NOTIFICATION SETTINGS ROUTES

  // Get notification settings
  app.get("/api/notification-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      let settings = await storage.getNotificationSettings(userId);
      
      if (!settings) {
        // Create default settings
        settings = await storage.createNotificationSettings({ userId });
      }
      
      res.json({ settings });
    } catch (error) {
      console.error("Get notification settings error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // Update notification settings
  app.patch("/api/notification-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      // Ensure settings exist first
      let settings = await storage.getNotificationSettings(userId);
      if (!settings) {
        settings = await storage.createNotificationSettings({ userId });
      }
      
      const updated = await storage.updateNotificationSettings(userId, req.body);
      res.json({ settings: updated });
    } catch (error) {
      console.error("Update notification settings error:", error);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // ============ MEDIA / S3 ROUTES ============

  // Check if S3 is configured
  app.get("/api/media/config", requireAuth, async (_req: Request, res: Response) => {
    res.json({ 
      s3Configured: isS3Configured(),
      message: isS3Configured() 
        ? "S3 est configuré et prêt" 
        : "S3 n'est pas configuré. Veuillez ajouter les clés AWS."
    });
  });

  // Get user storage usage
  app.get("/api/media/storage", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      const storageUsedBytes = await storage.getUserStorageUsed(userId);
      const userPlan = await storage.getUserPlan(userId);
      const plan = userPlan?.plan || "free";
      const storageLimitMB = storage.getStorageLimit(plan);
      
      res.json({
        usedBytes: storageUsedBytes,
        usedMB: Math.round(storageUsedBytes / (1024 * 1024) * 100) / 100,
        limitMB: storageLimitMB,
        limitBytes: storageLimitMB * 1024 * 1024,
        percentUsed: Math.round((storageUsedBytes / (storageLimitMB * 1024 * 1024)) * 100 * 10) / 10,
        plan
      });
    } catch (error) {
      console.error("Get storage error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération du stockage" });
    }
  });

  // Request upload URL (presigned URL for direct upload to S3)
  app.post("/api/media/upload-url", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!isS3Configured()) {
        return res.status(503).json({ message: "Le stockage S3 n'est pas configuré" });
      }

      const userId = (req as any).userId;
      const { filename, contentType, size, bookId, pageId, mediaType } = req.body;

      if (!filename || !contentType || !size || !bookId || !mediaType) {
        return res.status(400).json({ message: "Paramètres manquants" });
      }

      if (!["photo", "video"].includes(mediaType)) {
        return res.status(400).json({ message: "Type de média invalide" });
      }

      // Check storage quota
      const currentUsage = await storage.getUserStorageUsed(userId);
      const userPlan = await storage.getUserPlan(userId);
      const plan = userPlan?.plan || "free";
      const limitBytes = storage.getStorageLimit(plan) * 1024 * 1024;

      if (currentUsage + size > limitBytes) {
        return res.status(413).json({ 
          message: "Quota de stockage dépassé",
          currentUsage,
          limit: limitBytes,
          required: size
        });
      }

      // Verify book ownership
      const book = await storage.getBook(bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Generate S3 key
      const s3Key = generateMediaKey(userId, bookId, filename, mediaType);

      // Create media record
      const mediaFile = await storage.createMediaFile({
        userId,
        bookId,
        pageId: pageId || null,
        s3Key,
        filename,
        contentType,
        size,
        mediaType,
        status: "pending"
      });

      // Generate presigned upload URL
      const uploadUrl = await generateUploadUrl(s3Key, contentType, 3600);

      res.json({
        mediaId: mediaFile.id,
        uploadUrl,
        s3Key
      });
    } catch (error) {
      console.error("Generate upload URL error:", error);
      res.status(500).json({ message: "Erreur lors de la génération de l'URL d'upload" });
    }
  });

  // Confirm upload completed
  app.post("/api/media/:mediaId/confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { mediaId } = req.params;

      const mediaFile = await storage.getMediaFile(mediaId);
      if (!mediaFile) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }

      if (mediaFile.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const updated = await storage.updateMediaFileStatus(mediaId, "uploaded", new Date());

      // If media is a video and has a page associated, update the page with the mediaId
      if (mediaFile.mediaType === 'video' && mediaFile.pageId) {
        await storage.updateUserBookPage(mediaFile.pageId, {
          videoMediaId: mediaId
        });
      }

      // Generate download URL for immediate use
      const downloadUrl = await generateDownloadUrl(mediaFile.s3Key, 3600);

      res.json({
        media: updated,
        mediaId, // Return mediaId so frontend can store it
        downloadUrl
      });
    } catch (error) {
      console.error("Confirm upload error:", error);
      res.status(500).json({ message: "Erreur lors de la confirmation de l'upload" });
    }
  });

  // Get download URL for a media file
  app.get("/api/media/:mediaId/url", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { mediaId } = req.params;

      const mediaFile = await storage.getMediaFile(mediaId);
      if (!mediaFile) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }

      // Verify ownership through book
      const book = await storage.getBook(mediaFile.bookId || "");
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const downloadUrl = await generateDownloadUrl(mediaFile.s3Key, 3600);

      res.json({ url: downloadUrl });
    } catch (error) {
      console.error("Get download URL error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'URL" });
    }
  });

  // Get all media for a book
  app.get("/api/books/:bookId/media", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { bookId } = req.params;

      const book = await storage.getBook(bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const mediaFiles = await storage.getMediaFilesByBook(bookId);

      // Generate download URLs for each file
      const mediaWithUrls = await Promise.all(
        mediaFiles
          .filter(m => m.status === "uploaded")
          .map(async (media) => ({
            ...media,
            url: await generateDownloadUrl(media.s3Key, 3600)
          }))
      );

      res.json({ media: mediaWithUrls });
    } catch (error) {
      console.error("Get book media error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des médias" });
    }
  });

  // Delete a media file
  app.delete("/api/media/:mediaId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { mediaId } = req.params;

      const mediaFile = await storage.getMediaFile(mediaId);
      if (!mediaFile) {
        return res.status(404).json({ message: "Fichier non trouvé" });
      }

      if (mediaFile.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Delete from S3
      if (isS3Configured()) {
        try {
          await deleteFile(mediaFile.s3Key);
        } catch (s3Error) {
          console.error("S3 delete error:", s3Error);
        }
      }

      // Delete from database
      await storage.deleteMediaFile(mediaId);

      res.json({ message: "Fichier supprimé" });
    } catch (error) {
      console.error("Delete media error:", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  });

  // Maintenance endpoint: Clean up base64 video URLs from database
  app.post("/api/maintenance/cleanup-base64-videos", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      // Get all books for this user
      const books = await storage.getBooksByUserId(userId);
      let cleanedCount = 0;
      
      for (const book of books) {
        // Get all pages for this book
        const pages = await storage.getUserBookPages(book.id);
        
        for (const page of pages) {
          // Check if videoUrl is a base64 URL
          if (page.videoUrl && page.videoUrl.startsWith('data:')) {
            // Clear the invalid base64 URL
            await storage.updateUserBookPage(page.id, { videoUrl: null });
            cleanedCount++;
            console.log(`Cleaned base64 video URL from page ${page.id}`);
          }
        }
      }
      
      res.json({ 
        message: `Nettoyage terminé: ${cleanedCount} URL(s) base64 supprimée(s)`,
        cleanedCount 
      });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({ message: "Erreur lors du nettoyage" });
    }
  });

  // ============ ORDER ROUTES ============

  // Create a new order
  app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      // Validate request body with Zod
      const parseResult = createOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Données de commande invalides",
          errors: parseResult.error.flatten().fieldErrors
        });
      }
      
      const { bookId, productType, printOptions, pageCount, shippingAddress, billingAddress } = parseResult.data;

      // Calculate pricing (amounts in cents) - 50 pages included in base price
      const INCLUDED_PAGES = 50;
      const basePrice = productType === "ebook" ? 3000 : productType === "hardcover" ? 5499 : 4324;
      const pageRate = productType === "ebook" ? 50 : 98;
      const extraPages = Math.max(0, pageCount - INCLUDED_PAGES);
      const extraPagesPrice = extraPages * pageRate;
      const subtotal = basePrice + extraPagesPrice;
      const taxAmount = 0; // No taxes for now
      const shippingAmount = productType === "ebook" ? 0 : 1200; // $12 shipping for print
      const totalAmount = subtotal + shippingAmount;

      const order = await storage.createOrder({
        userId,
        bookId,
        orderNumber: generateOrderNumber(),
        status: "pending_payment",
        productType,
        pageCount,
        basePrice,
        extraPagesPrice,
        shippingPrice: shippingAmount,
        taxAmount,
        totalAmount,
        currency: "CAD",
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
      });

      // Log order creation event
      await storage.createOrderEvent({
        orderId: order.id,
        eventType: "order_created",
        newStatus: "pending_payment",
        metadata: { productType, pageCount },
      });

      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ message: "Erreur lors de la création de la commande" });
    }
  });

  // Get user's orders
  app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  // Get single order by ID
  app.get("/api/orders/:orderId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      // Users can only see their own orders
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la commande" });
    }
  });

  // Get order events/history
  app.get("/api/orders/:orderId/events", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;
      
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      const events = await storage.getOrderEvents(orderId);
      res.json(events);
    } catch (error) {
      console.error("Get order events error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
    }
  });

  // Get order by Stripe session ID (for success page)
  app.get("/api/orders/by-session/:sessionId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { sessionId } = req.params;
      
      const ordersList = await storage.getOrdersByStripeSessionId(sessionId);
      const order = ordersList[0];
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      // Users can only see their own orders
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Get order by session error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la commande" });
    }
  });

  // Get user's subscription
  app.get("/api/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const subscription = await storage.getSubscription(userId);
      res.json(subscription || { plan: "free", status: "active" });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'abonnement" });
    }
  });

  // Get user's payments history
  app.get("/api/payments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const payments = await storage.getPaymentsByUserId(userId);
      res.json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des paiements" });
    }
  });

  // ============ STRIPE CHECKOUT ROUTES ============

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (_req: Request, res: Response) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Get Stripe config error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de la configuration Stripe" });
    }
  });

  // Create checkout session for an order
  app.post("/api/orders/:orderId/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      if (order.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (order.status !== "pending_payment") {
        return res.status(400).json({ message: "Cette commande a déjà été payée" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const { stripeService } = await import('./stripeService');

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email || `${userId}@memoria.app`,
          userId,
          user.fullName || undefined
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customer.id });
      }

      // Build product name based on order type
      const productName = order.productType === "ebook" 
        ? `Livre Memoria E-Book (${order.pageCount} pages)`
        : order.productType === "hardcover"
        ? `Livre Memoria Couverture Rigide (${order.pageCount} pages)`
        : `Livre Memoria Couverture Souple (${order.pageCount} pages)`;

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      // Create checkout session
      const session = await stripeService.createCheckoutSession({
        customerId: stripeCustomerId,
        orderId: order.id,
        items: [
          {
            name: productName,
            unitAmount: order.totalAmount,
            quantity: 1,
          },
        ],
        successUrl: `${baseUrl}/app/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/app/order-cancel`,
        metadata: {
          orderNumber: order.orderNumber,
          productType: order.productType,
        },
      });

      // Update order with Stripe session ID
      await storage.updateOrder(order.id, { stripeSessionId: session.id });

      // Log checkout event
      await storage.createOrderEvent({
        orderId: order.id,
        eventType: "checkout_started",
        newStatus: order.status,
        metadata: { stripeSessionId: session.id },
      });

      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ message: "Erreur lors de la création de la session de paiement" });
    }
  });

  // Verify payment success and update order
  app.post("/api/orders/:orderId/verify-payment", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;
      const { sessionId } = req.body;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      if (order.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const { stripeService } = await import('./stripeService');
      const session = await stripeService.retrieveCheckoutSession(sessionId);

      if (session.payment_status === "paid") {
        // Update order status to paid
        await storage.updateOrder(order.id, {
          status: "paid",
          stripePaymentIntentId: (session.payment_intent as any)?.id || null,
        });

        // Create payment record
        await storage.createPayment({
          userId,
          orderId: order.id,
          stripePaymentIntentId: (session.payment_intent as any)?.id || null,
          amount: order.totalAmount,
          currency: order.currency,
          paymentType: "order",
          status: "succeeded",
        });

        // Log payment event
        await storage.createOrderEvent({
          orderId: order.id,
          eventType: "payment_received",
          newStatus: "paid",
          metadata: { 
            stripeSessionId: session.id,
            paymentIntentId: (session.payment_intent as any)?.id,
          },
        });

        res.json({ success: true, status: "paid" });
      } else {
        res.json({ success: false, status: session.payment_status });
      }
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: "Erreur lors de la vérification du paiement" });
    }
  });

  // ============ PDF GENERATION ROUTES ============

  // Generate PDF for a book
  app.post("/api/books/:bookId/generate-pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { bookId } = req.params;
      const { orderId, format = 'letter' } = req.body;

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const { generateBookPdf } = await import('./pdfService');
      const pdfExport = await generateBookPdf({
        bookId,
        orderId,
        format,
      });

      res.json({
        id: pdfExport.id,
        status: pdfExport.status,
        filename: pdfExport.filename,
        pageCount: pdfExport.pageCount,
      });
    } catch (error) {
      console.error("Generate PDF error:", error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // Get PDF export status
  app.get("/api/pdf-exports/:exportId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { exportId } = req.params;

      const pdfExport = await storage.getPdfExport(exportId);
      if (!pdfExport) {
        return res.status(404).json({ message: "Export non trouvé" });
      }

      const book = await storage.getBook(pdfExport.bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      res.json(pdfExport);
    } catch (error) {
      console.error("Get PDF export error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'export" });
    }
  });

  // Get signed download URL for a PDF
  app.get("/api/pdf-exports/:exportId/download", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { exportId } = req.params;

      const pdfExport = await storage.getPdfExport(exportId);
      if (!pdfExport) {
        return res.status(404).json({ message: "Export non trouvé" });
      }

      const book = await storage.getBook(pdfExport.bookId);
      if (!book || book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      if (pdfExport.status !== 'completed') {
        return res.status(400).json({ message: "Le PDF n'est pas encore prêt" });
      }

      const { getSignedDownloadUrl } = await import('./pdfService');
      const downloadUrl = await getSignedDownloadUrl(pdfExport.s3Key);

      res.json({ downloadUrl, filename: pdfExport.filename });
    } catch (error) {
      console.error("Get download URL error:", error);
      res.status(500).json({ message: "Erreur lors de la génération de l'URL de téléchargement" });
    }
  });

  // Get all PDF exports for a book
  app.get("/api/books/:bookId/pdf-exports", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.id;
      const { bookId } = req.params;

      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      if (book.userId !== userId) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const exports = await storage.getPdfExportsByBook(bookId);
      res.json(exports);
    } catch (error) {
      console.error("Get book PDF exports error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des exports" });
    }
  });

  // ============ ADMIN ROUTES ============

  // Get admin dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const [usersCount, ordersCount, ordersByStatus, subscriptionStats, orderStats, revenueStats, genderStats, regionStats, productStats] = await Promise.all([
        storage.getUsersCount(),
        storage.getOrdersCount(),
        storage.getOrdersCountByStatus(),
        storage.getSubscriptionStats(),
        storage.getOrderStats(),
        storage.getRevenueStats(30),
        storage.getGenderStats(),
        storage.getRegionStats(),
        storage.getProductStats(),
      ]);

      res.json({
        users: { total: usersCount },
        orders: { total: ordersCount, byStatus: ordersByStatus },
        subscriptions: subscriptionStats,
        orderStats,
        revenue: { last30Days: revenueStats },
        charts: {
          gender: genderStats,
          region: regionStats,
          products: productStats,
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ============ ADMIN EMAIL CAMPAIGNS ============

  // Get all email campaigns
  app.get("/api/admin/emails", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Get email campaigns error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des campagnes" });
    }
  });

  // Get recipient count preview
  app.get("/api/admin/emails/preview-count", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { filter = "all" } = req.query;
      const recipients = await storage.getUserEmailsByFilter(filter as string);
      res.json({ count: recipients.length });
    } catch (error) {
      console.error("Preview count error:", error);
      res.status(500).json({ message: "Erreur lors du calcul des destinataires" });
    }
  });

  // Create and send email campaign
  app.post("/api/admin/emails", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).userId;
      const { subject, bodyHtml, audienceFilter = "all" } = req.body;

      if (!subject || !bodyHtml) {
        return res.status(400).json({ message: "Sujet et contenu requis" });
      }

      // Get recipients
      const recipients = await storage.getUserEmailsByFilter(audienceFilter);
      
      if (recipients.length === 0) {
        return res.status(400).json({ message: "Aucun destinataire trouvé" });
      }

      // Create campaign record
      const campaign = await storage.createEmailCampaign({
        createdBy: adminId,
        subject,
        bodyHtml,
        audienceFilter,
        status: "sending",
        recipientCount: recipients.length,
      });

      // Send emails
      const { sendCampaignEmails } = await import("./emailService");
      const results = await sendCampaignEmails({
        subject,
        bodyHtml,
        recipients: recipients.map(r => ({ email: r.email, fullName: r.fullName })),
      });

      // Update campaign with results
      await storage.updateEmailCampaign(campaign.id, {
        status: "sent",
        sentCount: results.sent,
        failedCount: results.failed,
        sentAt: new Date(),
      });

      res.json({
        message: `Campagne envoyée: ${results.sent} succès, ${results.failed} échecs`,
        campaign: { ...campaign, sentCount: results.sent, failedCount: results.failed },
      });
    } catch (error) {
      console.error("Send campaign error:", error);
      res.status(500).json({ message: "Erreur lors de l'envoi de la campagne" });
    }
  });

  // Get all orders (admin) - with customer info
  app.get("/api/admin/orders", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let ordersList;
      if (status && typeof status === "string") {
        ordersList = await storage.getOrdersByStatus(status);
      } else {
        ordersList = await storage.getAllOrders(Number(limit), Number(offset));
      }
      
      // Enrich orders with customer info
      const ordersWithCustomer = await Promise.all(
        ordersList.map(async (order) => {
          const user = await storage.getUser(order.userId);
          return {
            ...order,
            customerName: user?.fullName || user?.firstName || null,
            customerEmail: user?.email || null,
          };
        })
      );
      
      res.json(ordersWithCustomer);
    } catch (error) {
      console.error("Admin get orders error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  // Update order status (admin)
  app.patch("/api/admin/orders/:orderId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).userId;
      const { orderId } = req.params;
      
      // Validate request body
      const parseResult = updateOrderStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Données invalides",
          errors: parseResult.error.flatten().fieldErrors
        });
      }
      
      const { status, trackingNumber, notes } = parseResult.data;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }

      // Validate status transition if status is being changed
      if (status && status !== order.status) {
        const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
        if (!allowedTransitions.includes(status)) {
          return res.status(400).json({ 
            message: `Transition de statut invalide: ${order.status} → ${status}`,
            allowedTransitions
          });
        }
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;

      const updatedOrder = await storage.updateOrder(orderId, updateData);

      // Log the status change
      await storage.createOrderEvent({
        orderId,
        eventType: "status_changed",
        previousStatus: order.status,
        newStatus: status || order.status,
        metadata: { notes, changedBy: adminId },
      });

      // Log admin activity
      await storage.createAdminActivityLog({
        adminId,
        action: "order_status_update",
        targetType: "order",
        targetId: orderId,
        details: { previousStatus: order.status, newStatus: status, notes },
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error("Admin update order error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la commande" });
    }
  });

  // Get all users (admin)
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const users = await storage.getAllUsers(Number(limit), Number(offset));
      
      // Remove sensitive info
      const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        authProvider: u.authProvider,
        onboardingCompleted: u.onboardingCompleted,
        createdAt: u.createdAt,
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Set user role (admin)
  app.patch("/api/admin/users/:userId/role", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).userId;
      const { userId } = req.params;
      const { role } = req.body;

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Rôle invalide" });
      }

      const updatedUser = await storage.setUserRole(userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Log admin activity
      await storage.createAdminActivityLog({
        adminId,
        action: "user_role_change",
        targetType: "user",
        targetId: userId,
        details: { newRole: role },
      });

      res.json({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role });
    } catch (error) {
      console.error("Admin set role error:", error);
      res.status(500).json({ message: "Erreur lors de la modification du rôle" });
    }
  });

  // Admin reset user password
  app.post("/api/admin/users/:userId/reset-password", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).userId;
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      if (user.authProvider !== 'email') {
        return res.status(400).json({ message: "Cet utilisateur utilise une connexion externe (Google, etc.)" });
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(userId, hashedPassword);

      await storage.createAdminActivityLog({
        adminId,
        action: "password_reset",
        targetType: "user",
        targetId: userId,
        details: { email: user.email },
      });

      console.log(`Admin ${adminId} reset password for user ${user.email}`);
      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe" });
    }
  });

  // Get admin activity logs
  app.get("/api/admin/activity-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await storage.getAdminActivityLogs(undefined, Number(limit));
      res.json(logs);
    } catch (error) {
      console.error("Admin activity logs error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des logs" });
    }
  });

  // Get all PDF exports (admin) with customer names
  app.get("/api/admin/pdf-exports", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const exports = await storage.getAllPdfExports(Number(limit), Number(offset));
      
      // Enrich exports with customer names from orders (with defensive error handling)
      const enrichedExports = await Promise.all(exports.map(async (exp) => {
        let customerName: string | null = null;
        let customerEmail: string | null = null;
        
        try {
          // Try to get customer from order first
          if (exp.orderId) {
            const order = await storage.getOrder(exp.orderId);
            if (order && order.userId) {
              const user = await storage.getUser(order.userId);
              if (user) {
                customerName = user.fullName || user.firstName || null;
                customerEmail = user.email || null;
              }
            }
          }
          
          // Fallback: try to get user from book if no customer info yet
          if (!customerName && exp.bookId) {
            const book = await storage.getBook(exp.bookId);
            if (book && book.userId) {
              const user = await storage.getUser(book.userId);
              if (user) {
                customerName = user.fullName || user.firstName || null;
                customerEmail = user.email || null;
              }
            }
          }
        } catch (enrichError) {
          console.error(`Error enriching export ${exp.id}:`, enrichError);
        }
        
        return {
          ...exp,
          customerName,
          customerEmail,
        };
      }));
      
      res.json(enrichedExports);
    } catch (error) {
      console.error("Admin pdf exports error:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des exports" });
    }
  });

  // Admin download PDF export
  app.get("/api/admin/pdf-exports/:exportId/download", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { exportId } = req.params;

      const pdfExport = await storage.getPdfExport(exportId);
      if (!pdfExport) {
        return res.status(404).json({ message: "Export non trouvé" });
      }

      if (!['completed', 'downloaded', 'sent'].includes(pdfExport.status)) {
        return res.status(400).json({ message: "Le PDF n'est pas encore prêt" });
      }

      const { getSignedDownloadUrl } = await import('./pdfService');
      const downloadUrl = await getSignedDownloadUrl(pdfExport.s3Key);

      // Update status to "downloaded" if it was "completed"
      if (pdfExport.status === 'completed') {
        await storage.updatePdfExport(exportId, { status: 'downloaded' });
        
        // Sync order status: PDF downloaded → Order "processing"
        if (pdfExport.orderId) {
          const order = await storage.getOrder(pdfExport.orderId);
          if (order && order.status === 'paid') {
            await storage.updateOrder(pdfExport.orderId, { status: 'processing' });
            console.log(`Order ${pdfExport.orderId} updated to processing (PDF downloaded)`);
          }
        }
      }

      res.json({ downloadUrl, filename: pdfExport.filename });
    } catch (error: any) {
      console.error("Admin download PDF error:", error);
      const message = error?.message || "Erreur inconnue";
      
      if (message.includes('not found') || message.includes('NotFound')) {
        return res.status(404).json({ message: "Fichier PDF introuvable dans le stockage" });
      }
      if (message.includes('not configured')) {
        return res.status(503).json({ message: "Service de stockage non configuré" });
      }
      res.status(500).json({ message: "Erreur lors de la génération de l'URL de téléchargement" });
    }
  });

  // Admin generate PDF for an order and send to customer
  app.post("/api/admin/orders/:orderId/generate-pdf", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { sendEmail = true } = req.body;
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      
      if (!order.bookId) {
        return res.status(400).json({ message: "Commande sans livre associé" });
      }
      
      const book = await storage.getBook(order.bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      const user = await storage.getUser(order.userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const bookId = order.bookId;
      
      if (sendEmail) {
        const { generateAndSendPdfToCustomer } = await import('./pdfService');
        const result = await generateAndSendPdfToCustomer({
          bookId,
          orderId: order.id,
          format: 'letter',
          customerEmail: user.email || '',
          customerName: user.fullName || user.firstName || 'Cher parent',
          orderNumber: order.orderNumber,
        });
        
        // Sync order status: PDF sent → Order "shipped"
        if (result.emailSent && ['paid', 'processing'].includes(order.status)) {
          await storage.updateOrder(order.id, { status: 'shipped' });
          console.log(`Order ${order.id} updated to shipped (PDF generated and email sent)`);
        }
        
        res.json({
          success: true,
          pdfExport: {
            id: result.pdfExport.id,
            status: result.pdfExport.status,
            filename: result.pdfExport.filename,
          },
          emailSent: result.emailSent,
        });
      } else {
        const { generateBookPdf } = await import('./pdfService');
        const pdfExport = await generateBookPdf({
          bookId,
          orderId: order.id,
          format: 'letter',
        });
        
        res.json({
          success: true,
          pdfExport: {
            id: pdfExport.id,
            status: pdfExport.status,
            filename: pdfExport.filename,
          },
          emailSent: false,
        });
      }
    } catch (error) {
      console.error("Admin generate PDF error:", error);
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // Admin update PDF export status
  app.patch("/api/admin/pdf-exports/:exportId/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { exportId } = req.params;
      const { status } = req.body;
      
      const validStatuses = ['pending', 'generating', 'completed', 'downloaded', 'sent', 'failed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }
      
      const pdfExport = await storage.getPdfExport(exportId);
      if (!pdfExport) {
        return res.status(404).json({ message: "Export non trouvé" });
      }
      
      const updatedExport = await storage.updatePdfExport(exportId, { status });
      res.json(updatedExport);
    } catch (error) {
      console.error("Admin update PDF status error:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Admin resend PDF email for an existing export
  app.post("/api/admin/pdf-exports/:exportId/send-email", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { exportId } = req.params;
      
      const pdfExport = await storage.getPdfExport(exportId);
      if (!pdfExport) {
        return res.status(404).json({ message: "Export non trouvé" });
      }
      
      if (!['completed', 'downloaded', 'sent'].includes(pdfExport.status)) {
        return res.status(400).json({ message: "Le PDF n'est pas encore prêt" });
      }
      
      const book = await storage.getBook(pdfExport.bookId);
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé" });
      }
      
      const user = await storage.getUser(book.userId);
      if (!user || !user.email) {
        return res.status(400).json({ message: "Email utilisateur non trouvé" });
      }
      
      let orderNumber = 'N/A';
      if (pdfExport.orderId) {
        const order = await storage.getOrder(pdfExport.orderId);
        if (order) {
          orderNumber = order.orderNumber;
        }
      }
      
      const { getSignedDownloadUrl } = await import('./pdfService');
      const downloadUrl = await getSignedDownloadUrl(pdfExport.s3Key, 7 * 24 * 60 * 60);
      
      const { sendPdfDeliveryEmail } = await import('./emailService');
      const emailSent = await sendPdfDeliveryEmail({
        customerEmail: user.email,
        customerName: user.fullName || user.firstName || 'Cher parent',
        bookName: book.childName || 'Mon album Memoria',
        orderNumber,
        downloadUrl,
        expiresInDays: 7,
      });
      
      if (emailSent) {
        // Update PDF status to "sent"
        await storage.updatePdfExport(exportId, { status: 'sent' });
        
        // Sync order status: PDF sent → Order "shipped"
        if (pdfExport.orderId) {
          const order = await storage.getOrder(pdfExport.orderId);
          if (order && ['paid', 'processing'].includes(order.status)) {
            await storage.updateOrder(pdfExport.orderId, { status: 'shipped' });
            console.log(`Order ${pdfExport.orderId} updated to shipped (PDF email sent)`);
          }
        }
        
        res.json({ success: true, message: "Email envoyé avec succès" });
      } else {
        res.status(500).json({ success: false, message: "Échec de l'envoi de l'email" });
      }
    } catch (error: any) {
      console.error("Admin send PDF email error:", error);
      res.status(500).json({ message: error?.message || "Erreur lors de l'envoi de l'email" });
    }
  });

  // Serve local PDFs (for PDFs without videos)
  app.get("/api/pdf-download/:path(*)", async (req: Request, res: Response) => {
    try {
      const relativePath = decodeURIComponent(req.params.path);
      
      // Security: prevent directory traversal
      if (relativePath.includes('..')) {
        return res.status(400).json({ message: "Chemin invalide" });
      }
      
      const { getLocalPdfBuffer } = await import('./pdfService');
      const pdfBuffer = getLocalPdfBuffer(relativePath);
      
      if (!pdfBuffer) {
        return res.status(404).json({ message: "PDF non trouvé" });
      }
      
      const filename = relativePath.split('/').pop() || 'document.pdf';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF download error:", error);
      res.status(500).json({ message: "Erreur lors du téléchargement du PDF" });
    }
  });

  return httpServer;
}

// ============ HELPER FUNCTIONS FOR AGE CALCULATION ============

// Calculate exact age in months, weeks, and days from birth date
function calculateExactAge(birthDate: Date, fromDate: Date = new Date()) {
  const birth = new Date(birthDate);
  const now = new Date(fromDate);
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonths,
    isPregnancy: totalDays < 0
  };
}

// Calculate pregnancy progress (weeks since conception or until due date)
function calculatePregnancyProgress(dueDate: Date, fromDate: Date = new Date()) {
  const due = new Date(dueDate);
  const now = new Date(fromDate);
  
  const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const weeksUntilDue = Math.floor(daysUntilDue / 7);
  
  // Pregnancy is typically 40 weeks (280 days)
  const conceptionDate = new Date(due);
  conceptionDate.setDate(conceptionDate.getDate() - 280);
  
  const daysSinceConception = Math.floor((now.getTime() - conceptionDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceConception = Math.floor(daysSinceConception / 7);
  const monthsPregnant = Math.floor(weeksSinceConception / 4);
  
  return {
    weeksPregnant: weeksSinceConception,
    monthsPregnant,
    weeksUntilDue,
    daysUntilDue,
    trimester: weeksSinceConception < 13 ? 1 : weeksSinceConception < 27 ? 2 : 3,
    isPastDue: daysUntilDue < 0
  };
}

// Format age for display in notifications
function formatAgeMessage(childName: string, birthDate: Date): string {
  const age = calculateExactAge(birthDate);
  
  if (age.totalDays < 0) {
    return `${childName} n'est pas encore né(e)`;
  }
  
  if (age.totalDays === 0) {
    return `${childName} est né(e) aujourd'hui !`;
  }
  
  if (age.totalDays < 7) {
    return `${childName} a ${age.totalDays} jour${age.totalDays > 1 ? 's' : ''}`;
  }
  
  if (age.totalDays < 30) {
    const weeks = age.totalWeeks;
    const remainingDays = age.totalDays % 7;
    if (remainingDays === 0) {
      return `${childName} a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    return `${childName} a ${weeks} semaine${weeks > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
  }
  
  if (age.years === 0) {
    if (age.days === 0) {
      return `${childName} a ${age.months} mois`;
    }
    return `${childName} a ${age.months} mois et ${age.days} jour${age.days > 1 ? 's' : ''}`;
  }
  
  if (age.months === 0) {
    return `${childName} a ${age.years} an${age.years > 1 ? 's' : ''}`;
  }
  
  return `${childName} a ${age.years} an${age.years > 1 ? 's' : ''} et ${age.months} mois`;
}

// Format pregnancy progress for display
function formatPregnancyMessage(childName: string, dueDate: Date): string {
  const progress = calculatePregnancyProgress(dueDate);
  
  if (progress.isPastDue) {
    const daysOver = Math.abs(progress.daysUntilDue);
    return `Terme dépassé de ${daysOver} jour${daysOver > 1 ? 's' : ''} - ${childName} arrive bientôt !`;
  }
  
  if (progress.daysUntilDue === 0) {
    return `C'est le jour prévu pour l'arrivée de ${childName} !`;
  }
  
  if (progress.weeksUntilDue === 0) {
    return `Plus que ${progress.daysUntilDue} jour${progress.daysUntilDue > 1 ? 's' : ''} avant l'arrivée de ${childName} !`;
  }
  
  return `Vous êtes enceinte de ${progress.weeksPregnant} semaines (${progress.monthsPregnant} mois). Plus que ${progress.weeksUntilDue} semaine${progress.weeksUntilDue > 1 ? 's' : ''} !`;
}

// ============ MILESTONE CATALOGS BY BABY STATUS ============

// BORN BABY: Age-based milestones from birth date
function generateBornMilestones(birthDate: Date, childName: string, bookId: string, userId: string) {
  const milestones = [
    // First weeks
    { days: 7, title: "1 semaine", message: `${childName} a 1 semaine ! Documentez ces premiers moments précieux.`, icon: "baby" },
    { days: 14, title: "2 semaines", message: `${childName} a 2 semaines. Comment se passe l'adaptation ?`, icon: "heart" },
    
    // First months
    { days: 30, title: "1 mois", message: `${childName} a 1 mois ! Capturez son premier sourire.`, icon: "camera" },
    { days: 60, title: "2 mois", message: `${childName} a 2 mois. Les vaccins approchent !`, icon: "baby" },
    { days: 90, title: "3 mois", message: `${childName} a 3 mois. Commence à suivre les objets des yeux ?`, icon: "star" },
    { days: 120, title: "4 mois", message: `${childName} a 4 mois. Premier éclat de rire ?`, icon: "heart" },
    { days: 150, title: "5 mois", message: `${childName} a 5 mois. Essaie de se retourner ?`, icon: "baby" },
    { days: 180, title: "6 mois", message: `${childName} a 6 mois ! Début de la diversification alimentaire.`, icon: "cake" },
    { days: 210, title: "7 mois", message: `${childName} a 7 mois. Position assise ?`, icon: "star" },
    { days: 240, title: "8 mois", message: `${childName} a 8 mois. Premiers mots (maman, papa) ?`, icon: "heart" },
    { days: 270, title: "9 mois", message: `${childName} a 9 mois. Rampe ou fait du 4 pattes ?`, icon: "baby" },
    { days: 300, title: "10 mois", message: `${childName} a 10 mois. Se tient debout avec appui ?`, icon: "star" },
    { days: 330, title: "11 mois", message: `${childName} a 11 mois. Premiers pas bientôt ?`, icon: "heart" },
    
    // First year and beyond
    { days: 365, title: "1 an !", message: `Joyeux 1er anniversaire ${childName} ! Un an de bonheur.`, icon: "cake" },
    { days: 547, title: "18 mois", message: `${childName} a 18 mois. Court partout maintenant ?`, icon: "baby" },
    { days: 730, title: "2 ans !", message: `Joyeux 2e anniversaire ${childName} !`, icon: "cake" },
    { days: 1095, title: "3 ans !", message: `Joyeux 3e anniversaire ${childName} ! Entrée à la maternelle bientôt.`, icon: "cake" },
  ];

  const now = new Date();
  const notifications: any[] = [];

  for (const milestone of milestones) {
    const triggerDate = new Date(birthDate);
    triggerDate.setDate(triggerDate.getDate() + milestone.days);
    
    // Only create notifications for future milestones or very recent ones (last 30 days)
    const daysDiff = Math.floor((triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= -30) {
      notifications.push({
        userId,
        bookId,
        type: milestone.days >= 365 ? "anniversary" : "milestone",
        title: milestone.title,
        message: milestone.message,
        icon: milestone.icon,
        triggerDate,
        milestoneAge: milestone.days,
        actionUrl: `/app/book/${bookId}/edit`,
      });
    }
  }

  return notifications;
}

// EXPECTING: Pregnancy countdown until due date
function generatePregnancyNotifications(dueDate: Date, childName: string, bookId: string, userId: string) {
  const pregnancyMilestones = [
    // Weekly countdown in final weeks
    { weeksLeft: 12, title: "3e trimestre", message: `Plus que 12 semaines ! C'est le dernier trimestre avant l'arrivée de ${childName}.`, icon: "baby" },
    { weeksLeft: 10, title: "10 semaines", message: `Plus que 10 semaines ! Avez-vous commencé à préparer la chambre ?`, icon: "heart" },
    { weeksLeft: 8, title: "8 semaines", message: `Plus que 8 semaines avant l'arrivée de ${childName} !`, icon: "star" },
    { weeksLeft: 6, title: "6 semaines", message: `Plus que 6 semaines ! Les préparatifs avancent bien ?`, icon: "baby" },
    { weeksLeft: 4, title: "1 mois !", message: `Plus qu'un mois avant l'arrivée de ${childName} ! Avez-vous préparé la valise de maternité ?`, icon: "heart" },
    { weeksLeft: 3, title: "3 semaines", message: `Plus que 3 semaines ! Le compte à rebours a commencé.`, icon: "star" },
    { weeksLeft: 2, title: "2 semaines", message: `Plus que 2 semaines avant la rencontre avec ${childName} !`, icon: "baby" },
    { weeksLeft: 1, title: "1 semaine !", message: `Plus qu'une semaine ! Bientôt le grand jour.`, icon: "heart" },
    { weeksLeft: 0, title: "Jour J !", message: `C'est le jour prévu pour l'arrivée de ${childName} ! Bon courage !`, icon: "cake" },
  ];

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day
  const notifications: any[] = [];

  // Check if due date has already passed
  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);
  
  if (dueDateNormalized < now) {
    // Due date is in the past, don't generate countdown notifications
    return notifications;
  }

  for (const milestone of pregnancyMilestones) {
    const triggerDate = new Date(dueDate);
    triggerDate.setDate(triggerDate.getDate() - (milestone.weeksLeft * 7));
    triggerDate.setHours(9, 0, 0, 0); // Set to 9 AM for user-friendly timing
    
    // Only create notifications for future dates (starting from today)
    const daysDiff = Math.floor((triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0) { // Only future notifications
      notifications.push({
        userId,
        bookId,
        type: "pregnancy",
        title: milestone.title,
        message: milestone.message,
        icon: milestone.icon,
        triggerDate,
        milestoneAge: milestone.weeksLeft * -7, // Negative for countdown
        actionUrl: `/app/book/${bookId}/edit`,
      });
    }
  }

  return notifications;
}

// ADOPTION: Weekly reminders on user-chosen weekday
// Returns null if weekday is not set (caller should handle HTTP 400)
function generateAdoptionNotifications(arrivalDate: Date, childName: string, bookId: string, userId: string, weekday: number | null): any[] | null {
  // Guard: weekday must be set for adoptions
  if (weekday === null || weekday === undefined) {
    return null; // Signal that weekday is required
  }
  
  const notifications: any[] = [];
  const now = new Date();
  const targetWeekday = weekday;
  
  // Generate weekly reminders for 1 year from arrival date
  const endDate = new Date(arrivalDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  // Find the first occurrence of the target weekday after arrival
  let currentDate = new Date(arrivalDate);
  const daysUntilTarget = (targetWeekday - currentDate.getDay() + 7) % 7;
  currentDate.setDate(currentDate.getDate() + daysUntilTarget);
  
  // If arrival is on target day, start from that day
  if (daysUntilTarget === 0) {
    currentDate = new Date(arrivalDate);
  }

  const weekdayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const weekdayName = weekdayNames[targetWeekday];
  
  let weekNumber = 0;
  while (currentDate <= endDate) {
    weekNumber++;
    
    // Only create notifications for future dates
    const daysDiff = Math.floor((currentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= -7) {
      const isAnniversary = weekNumber === 52;
      
      notifications.push({
        userId,
        bookId,
        type: isAnniversary ? "anniversary" : "weekly_reminder",
        title: isAnniversary ? "1 an ensemble !" : `Semaine ${weekNumber}`,
        message: isAnniversary 
          ? `Joyeux 1er anniversaire d'arrivée de ${childName} ! Une année de souvenirs précieux.`
          : `C'est ${weekdayName}, votre jour de souvenir ! Qu'avez-vous vécu cette semaine avec ${childName} ?`,
        icon: isAnniversary ? "cake" : "camera",
        triggerDate: new Date(currentDate),
        milestoneAge: weekNumber * 7,
        actionUrl: `/app/book/${bookId}/edit`,
      });
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return notifications;
}
