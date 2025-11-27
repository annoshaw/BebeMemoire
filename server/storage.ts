import { db } from "./db";
import { users, books, memories, type User, type InsertUser, type Book, type InsertBook, type Memory, type InsertMemory } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
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
}

export const storage = new DatabaseStorage();
