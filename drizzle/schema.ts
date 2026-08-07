import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // Legacy fields are retained only to preserve existing records; local auth never uses them.
  legacyOpenId: varchar("openId", { length: 64 }).unique(),
  legacyLoginMethod: varchar("loginMethod", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isSuperAdmin: boolean("isSuperAdmin").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Single-use invitations that authorize a specific email to create an account.
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isSuperAdmin: boolean("isSuperAdmin").default(false).notNull(),
  createdByUserId: int("createdByUserId"),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * Rounds (Jornadas) - Each round contains 6 matches
 */
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  roundNumber: int("roundNumber").notNull().unique(),
  prize: text("prize"), // Informational prize description
  bettingDeadline: timestamp("bettingDeadline").notNull(),
  winnerId: int("winnerId"), // User ID of the round winner (null if no winner)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

/**
 * Matches (Jogos) - 6 matches per round
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  homeTeam: varchar("homeTeam", { length: 100 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 100 }).notNull(),
  result: mysqlEnum("result", ["1", "X", "2"]), // Official result (null until entered)
  matchOrder: int("matchOrder").notNull(), // Order within the round (1-6)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Predictions (Apostas) - Each bettor's prediction for each match
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  userId: int("userId").notNull(),
  prediction: mysqlEnum("prediction", ["1", "X", "2"]).notNull(),
  isCorrect: mysqlEnum("isCorrect", ["true", "false", "pending"]).default("pending").notNull(), // Calculated after result is entered
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;


/**
 * Email Notifications - Track sent emails
 */
export const emailNotifications = mysqlTable("emailNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roundId: int("roundId"),
  type: mysqlEnum("type", ["round_created", "deadline_reminder", "results_published"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  sent: mysqlEnum("sent", ["true", "false"]).default("false").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;
