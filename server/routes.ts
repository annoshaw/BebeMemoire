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
      
      // Log the reset link (in production, this would be sent via email)
      console.log("=".repeat(60));
      console.log("PASSWORD RESET LINK (for development):");
      console.log(`Email: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log("=".repeat(60));
      
      res.json({ 
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
        // In development mode, include the reset URL in the response
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
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
      let templateParts = null;
      let templatePages: any[] | null = null;
      
      if (book.templateSlug) {
        template = await storage.getBookTemplateBySlug(book.templateSlug);
        if (template) {
          templateParts = await storage.getTemplateParts(template.id);
          templatePages = await storage.getTemplatePages(template.id);
        }
      }

      // Add inspiration pages (from userPages with isInspirationPage flag) to templatePages
      const inspirationPages = pagesWithFreshUrls.filter(page => {
        const customData = page.customData as any;
        return customData?.isInspirationPage === true;
      });

      if (inspirationPages.length > 0 && templatePages) {
        const inspirationTemplatePages = inspirationPages.map(page => {
          const customData = page.customData as any;
          return {
            id: `inspiration-${page.id}`,
            templateId: template?.id || null,
            partId: null, // Inspiration pages are not part of any template part
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
        
        // Merge and sort by page number
        templatePages = [...templatePages, ...inspirationTemplatePages].sort((a, b) => a.pageNumber - b.pageNumber);
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

      const pages = await storage.createUserBookPagesFromTemplate(req.params.bookId, template.id);
      
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

      // If templateSlug is provided and not 'custom', create book with template
      if (templateSlug && templateSlug !== 'custom') {
        try {
          const result = await storage.createBookWithTemplate(
            userId, 
            validation.data, 
            templateSlug,
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
