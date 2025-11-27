import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  fullName: text("full_name").notNull(),
  address: text("address"),
  gender: text("gender"),
  authProvider: text("auth_provider").default("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books).omit({
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
