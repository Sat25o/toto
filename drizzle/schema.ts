import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
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
  prizeAmount: decimal("prizeAmount", { precision: 10, scale: 2 }), // Informational monetary value for equal split
  carriedPrizeAmount: decimal("carriedPrizeAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  prizeRolledOver: boolean("prizeRolledOver").default(false).notNull(),
  bettingDeadline: timestamp("bettingDeadline").notNull(),
  winnerId: int("winnerId"), // Legacy first winner ID for backwards compatibility
  isSettled: boolean("isSettled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

/**
 * A jornada can have multiple winners. Each winner receives the same recorded share.
 */
export const roundWinners = mysqlTable(
  "roundWinners",
  {
    id: int("id").autoincrement().primaryKey(),
    roundId: int("roundId").notNull(),
    userId: int("userId").notNull(),
    prizeShare: decimal("prizeShare", { precision: 10, scale: 2 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("roundWinners_round_user_unique").on(table.roundId, table.userId)],
);

export type RoundWinner = typeof roundWinners.$inferSelect;

/**
 * Matches (Jogos) - 6 matches per round
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  homeTeam: varchar("homeTeam", { length: 100 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 100 }).notNull(),
  result: mysqlEnum("result", ["1", "X", "2"]), // Official result (null until entered)
  isPostponed: boolean("isPostponed").default(false).notNull(),
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

/** Regras da liga, apresentadas a todos os participantes e geridas pelo administrador. */
export const leagueRules = mysqlTable("leagueRules", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  displayOrder: int("displayOrder").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeagueRule = typeof leagueRules.$inferSelect;

/** Avisos publicados pelo administrador que aparecem no Dashboard dos apostadores. */
export const adminMessages = mysqlTable("adminMessages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminMessage = typeof adminMessages.$inferSelect;

/** Subscrições de browser autorizadas pelos participantes para receber notificações push. */
export const pushSubscriptions = mysqlTable(
  "pushSubscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    endpoint: text("endpoint").notNull(),
    endpointHash: varchar("endpointHash", { length: 64 }).notNull(),
    p256dh: varchar("p256dh", { length: 255 }).notNull(),
    auth: varchar("auth", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("pushSubscriptions_endpoint_hash_unique").on(table.endpointHash)],
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

/** Os 16 qualificados registados para a edição anual da Liga dos Campeões. */
export const championsLeagueEntries = mysqlTable(
  "championsLeagueEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    edition: varchar("edition", { length: 20 }).notNull(),
    userId: int("userId").notNull(),
    seed: int("seed").notNull(),
    qualificationScore: int("qualificationScore").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("championsLeagueEntries_edition_user_unique").on(table.edition, table.userId),
    uniqueIndex("championsLeagueEntries_edition_seed_unique").on(table.edition, table.seed),
  ],
);

/** Confrontos do quadro, incluindo os lugares que serão preenchidos pelos vencedores posteriores. */
export const championsLeagueMatches = mysqlTable(
  "championsLeagueMatches",
  {
    id: int("id").autoincrement().primaryKey(),
    edition: varchar("edition", { length: 20 }).notNull(),
    stage: mysqlEnum("stage", ["round_of_16", "quarter_final", "semi_final", "final"]).notNull(),
    roundNumber: int("roundNumber").notNull(),
    matchOrder: int("matchOrder").notNull(),
    homeEntryId: int("homeEntryId"),
    awayEntryId: int("awayEntryId"),
    winnerEntryId: int("winnerEntryId"),
    status: mysqlEnum("status", ["pending", "complete"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("championsLeagueMatches_edition_stage_order_unique").on(table.edition, table.stage, table.matchOrder)],
);

export type ChampionsLeagueEntry = typeof championsLeagueEntries.$inferSelect;
export type ChampionsLeagueMatch = typeof championsLeagueMatches.$inferSelect;
