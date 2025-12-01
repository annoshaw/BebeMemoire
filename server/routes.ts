import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertBookSchema, insertMemorySchema, type User } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";

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

  // Create a new book
  app.post("/api/books", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const validation = insertBookSchema.safeParse({
        ...req.body,
        userId: userId,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: fromError(validation.error).toString()
        });
      }

      const book = await storage.createBook(validation.data);
      res.status(201).json({ book });
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

  return httpServer;
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
