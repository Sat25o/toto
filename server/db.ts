import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, rounds, matches, predictions, emailNotifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ ROUNDS ============
export async function createRound(data: {
  roundNumber: number;
  prize?: string;
  bettingDeadline: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rounds).values({
    roundNumber: data.roundNumber,
    prize: data.prize,
    bettingDeadline: data.bettingDeadline,
  });
  
  return result;
}

export async function getRound(roundId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRoundByNumber(roundNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(rounds).where(eq(rounds.roundNumber, roundNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllRounds() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(rounds).orderBy(rounds.roundNumber);
}

// ============ MATCHES ============
export async function createMatches(roundId: number, matchesData: Array<{
  homeTeam: string;
  awayTeam: string;
  matchOrder: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const values = matchesData.map(m => ({
    roundId,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    matchOrder: m.matchOrder,
  }));
  
  return await db.insert(matches).values(values);
}

export async function getMatchesByRound(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(matches).where(eq(matches.roundId, roundId)).orderBy(matches.matchOrder);
}

export async function updateMatchResult(matchId: number, result: "1" | "X" | "2") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(matches).set({ result }).where(eq(matches.id, matchId));
}

// ============ PREDICTIONS ============
export async function getPrediction(matchId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(predictions)
    .where(and(eq(predictions.matchId, matchId), eq(predictions.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdatePrediction(matchId: number, userId: number, prediction: "1" | "X" | "2") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getPrediction(matchId, userId);
  
  if (existing) {
    return await db.update(predictions)
      .set({ prediction })
      .where(eq(predictions.id, existing.id));
  } else {
    return await db.insert(predictions).values({
      matchId,
      userId,
      prediction,
    });
  }
}

export async function getPredictionsByRoundAndUser(roundId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    prediction: predictions,
    match: matches,
  }).from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(and(eq(matches.roundId, roundId), eq(predictions.userId, userId)))
    .orderBy(matches.matchOrder);
}

export async function getPredictionsByRound(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    prediction: predictions,
    match: matches,
  }).from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(eq(matches.roundId, roundId));
}

// ============ STANDINGS ============
export async function getStandings() {
  const db = await getDb();
  if (!db) return [];
  
  // Count correct predictions per user across all rounds
  const result = await db.select({
    userId: predictions.userId,
    userName: users.name,
    userEmail: users.email,
    correctCount: sql<number>`COUNT(CASE WHEN ${predictions.isCorrect} = 'true' THEN 1 END)`,
  })
    .from(predictions)
    .innerJoin(users, eq(predictions.userId, users.id))
    .groupBy(predictions.userId)
    .orderBy(desc(sql<number>`COUNT(CASE WHEN ${predictions.isCorrect} = 'true' THEN 1 END)`));
  
  return result;
}

// ============ WINNER CALCULATION ============
export async function calculateRoundWinner(roundId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all matches for this round with results
  const roundMatches = await db.select().from(matches).where(eq(matches.roundId, roundId));
  
  // Check if all matches have results
  const allResultsEntered = roundMatches.every(m => m.result !== null);
  if (!allResultsEntered) {
    throw new Error("Not all match results have been entered");
  }
  
  // Get all predictions for this round
  const roundPredictions = await db.select({
    prediction: predictions,
    match: matches,
  }).from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(eq(matches.roundId, roundId));
  
  // Mark predictions as correct or false
  for (const pred of roundPredictions) {
    const isCorrect = pred.prediction.prediction === pred.match.result ? "true" : "false";
    await db.update(predictions)
      .set({ isCorrect })
      .where(eq(predictions.id, pred.prediction.id));
  }
  
  // Find users who got all 6 correct
  const userCorrectCounts = new Map<number, number>();
  for (const pred of roundPredictions) {
    const userId = pred.prediction.userId;
    const count = userCorrectCounts.get(userId) || 0;
    if (pred.prediction.prediction === pred.match.result) {
      userCorrectCounts.set(userId, count + 1);
    } else {
      userCorrectCounts.set(userId, count);
    }
  }
  
  // Find the winner (6 correct predictions)
  let winnerId: number | null = null;
  userCorrectCounts.forEach((count, userId) => {
    if (count === 6 && winnerId === null) {
      winnerId = userId;
    }
  })
  
  // Update round with winner
  if (winnerId) {
    await db.update(rounds).set({ winnerId }).where(eq(rounds.id, roundId));
  }
  
  return winnerId;
}


// ============ EMAIL NOTIFICATIONS ============
export async function createEmailNotification(data: {
  userId: number;
  roundId?: number;
  type: "round_created" | "deadline_reminder" | "results_published";
  subject: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(emailNotifications).values({
    userId: data.userId,
    roundId: data.roundId,
    type: data.type,
    subject: data.subject,
  });
}

export async function markEmailAsSent(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(emailNotifications)
    .set({ sent: "true", sentAt: new Date() })
    .where(eq(emailNotifications.id, notificationId));
}

export async function getUnsentNotifications() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      notification: emailNotifications,
      user: users,
    })
    .from(emailNotifications)
    .innerJoin(users, eq(emailNotifications.userId, users.id))
    .where(eq(emailNotifications.sent, "false"));
}
