import { db } from "./db";
import { users, books, memories, userPlans, qrCodes, type User, type InsertUser, type UpsertUser, type Book, type InsertBook, type Memory, type InsertMemory, type UserPlan, type InsertUserPlan, type QRCode, type InsertQRCode } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
