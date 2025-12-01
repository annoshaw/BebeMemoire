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

  return httpServer;
}
