import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertBookSchema, insertMemorySchema, type User } from "@shared/schema";
import { fromError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

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
      const { email, password } = req.body;
      
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

  // AI ROUTES

  // Generate family tree background with AI (no auth required for local books)
  app.post("/api/ai/generate-tree-background", async (req: Request, res: Response) => {
    try {
      const { memberCount, childName, style } = req.body;
      
      const styleDescriptions: Record<string, string> = {
        whimsical: "whimsical watercolor style with soft pastel colors, dreamy atmosphere, cute tree houses, lanterns, and hearts",
        classic: "classic elegant style with ornate golden frames, vintage botanical illustrations, and warm sepia tones",
        modern: "modern minimalist style with clean geometric shapes, soft gradients, and contemporary pastel colors",
        nature: "natural organic style with lush green foliage, delicate flowers, butterflies, and soft sunlight filtering through leaves",
        fairy: "magical fairy tale style with enchanted forest, sparkles, mushrooms, and soft glowing lights"
      };
      
      const selectedStyle = styleDescriptions[style] || styleDescriptions.whimsical;
      
      const prompt = `Create a beautiful family tree background illustration in ${selectedStyle}. 
The design should have a large decorative tree in the center with space for ${memberCount || 4} family member photos arranged on branches. 
The tree should have elegant branches spreading outward with decorative leaves and flowers.
Include subtle decorative elements like birds, butterflies, or hearts.
The background should be soft and dreamy, perfect for a baby memory book.
${childName ? `This is for a child named ${childName}.` : ''}
The image should be vertical/portrait orientation, suitable as a page background.
Leave clear circular spaces on the branches where family photos can be placed.
Use soft, warm colors that feel loving and nostalgic.`;

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      });

      if (!response.data || !response.data[0]?.b64_json) {
        throw new Error("Aucune image générée");
      }

      const base64 = response.data[0].b64_json;
      const dataUrl = `data:image/png;base64,${base64}`;
      
      res.json({ 
        success: true, 
        imageUrl: dataUrl,
        message: "Arrière-plan généré avec succès" 
      });
    } catch (error: any) {
      console.error("AI generate tree background error:", error);
      res.status(500).json({ 
        message: "Erreur lors de la génération de l'arrière-plan",
        error: error.message 
      });
    }
  });

  // SPELL CHECK AND GRAMMAR API
  app.post("/api/spellcheck", async (req: Request, res: Response) => {
    try {
      const { text, language = "fr" } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Texte requis" });
      }
      
      if (text.trim().length === 0) {
        return res.json({ corrections: [], correctedText: text });
      }
      
      const languageName = language === "fr" ? "French" : "English";
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a spell-checker and grammar corrector for ${languageName} text. Analyze the given text and return a JSON response with:
1. "corrections": an array of objects, each with:
   - "original": the incorrect word or phrase
   - "suggestion": the corrected version
   - "type": either "spelling" or "grammar"
   - "startIndex": the character position where the error starts
   - "endIndex": the character position where the error ends
2. "correctedText": the full text with all corrections applied

If there are no errors, return an empty corrections array and the original text as correctedText.
Only respond with valid JSON, no additional text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });
      
      const result = response.choices[0]?.message?.content;
      if (!result) {
        return res.json({ corrections: [], correctedText: text });
      }
      
      const parsed = JSON.parse(result);
      res.json({
        corrections: parsed.corrections || [],
        correctedText: parsed.correctedText || text
      });
    } catch (error: any) {
      console.error("Spellcheck error:", error);
      res.status(500).json({ 
        message: "Erreur lors de la vérification",
        corrections: [],
        correctedText: req.body.text || ""
      });
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
