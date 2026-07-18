import {
  mysqlTable,
  serial,
  bigint,
  varchar,
  text,
  int,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  avatar: varchar("avatar", { length: 16 }).notNull().default("🎮"),
  bio: text("bio"),
  phone: varchar("phone", { length: 32 }),
  qrisImage: text("qrisImage"),
  qrisNote: varchar("qrisNote", { length: 255 }),
  isVerified: boolean("isVerified").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const captchas = mysqlTable("captchas", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 255 }).notNull(),
  answer: varchar("answer", { length: 64 }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userBadges = mysqlTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  badge: varchar("badge", { length: 32 }).notNull(), // verified | trusted | top_seller | new | fast_response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  sellerId: bigint("sellerId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  game: varchar("game", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default("Akun"),
  description: text("description"),
  price: int("price").notNull(), // in IDR
  image: varchar("image", { length: 16 }).notNull().default("🎯"),
  level: varchar("level", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available | sold
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: serial("id").primaryKey(),
  buyerId: bigint("buyerId", { mode: "number", unsigned: true }).notNull(),
  sellerId: bigint("sellerId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: bigint("conversationId", {
    mode: "number",
    unsigned: true,
  }).notNull(),
  senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stories = mysqlTable("stories", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  text: varchar("text", { length: 280 }).notNull(),
  emoji: varchar("emoji", { length: 16 }).notNull().default("🔥"),
  color: varchar("color", { length: 32 }).notNull().default("purple"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});
