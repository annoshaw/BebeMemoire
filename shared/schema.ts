import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: text("password"),
  fullName: text("full_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  address: text("address"),
  gender: text("gender"),
  phone: text("phone"),
  country: text("country"),
  authProvider: text("auth_provider").default("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

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
  babyStatus: text("baby_status"), // born, expecting, adoption
  babyGender: text("baby_gender"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books, {
  birthDate: z.coerce.date().optional(),
}).omit({
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

export const userPlans = pgTable("user_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  plan: text("plan").notNull().default("free"), // free, premium, platine
  storageUsed: integer("storage_used").notNull().default(0), // in MB
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserPlanSchema = createInsertSchema(userPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type UserPlan = typeof userPlans.$inferSelect;

export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memoryId: varchar("memory_id").notNull().references(() => memories.id, { onDelete: "cascade" }).unique(),
  qrUrl: text("qr_url").notNull(),
  videoUrl: text("video_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;
export type QRCode = typeof qrCodes.$inferSelect;
