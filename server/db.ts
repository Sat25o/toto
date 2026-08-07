import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import {
  emailNotifications,
  invitations,
  matches,
  predictions,
  rounds,
  users,
} from "../drizzle/schema";

export const SUPER_ADMIN_EMAIL = "ricardodonascimento@gmail.com";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// ============ USERS AND LOCAL AUTHENTICATION ============

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normaliseEmail(email)))
    .limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function verifyPassword(plainPassword: string, passwordHash: string) {
  if (!passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function updateLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.isSuperAdmin), users.name);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");
  if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
    throw new Error("A função do super administrador não pode ser alterada");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function setUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");
  if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
    throw new Error("O super administrador não pode ser desativado");
  }

  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

// ============ INVITATIONS ============

export async function getInvitationForRegistration(email: string, token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.email, normaliseEmail(email)),
        eq(invitations.tokenHash, hashInvitationToken(token)),
        isNull(invitations.usedAt),
      ),
    )
    .limit(1);

  const invitation = result[0];
  if (!invitation || invitation.expiresAt <= new Date()) return undefined;
  return invitation;
}

export async function createInvitation(data: {
  email: string;
  token: string;
  role: "user" | "admin";
  isSuperAdmin?: boolean;
  createdByUserId: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const email = normaliseEmail(data.email);
  const existingUser = await getUserByEmail(email);
  if (existingUser) throw new Error("Já existe uma conta com este email");

  await db
    .insert(invitations)
    .values({
      email,
      tokenHash: hashInvitationToken(data.token),
      role: data.role,
      isSuperAdmin: data.isSuperAdmin ?? false,
      createdByUserId: data.createdByUserId,
      expiresAt: data.expiresAt,
    })
    .onDuplicateKeyUpdate({
      set: {
        tokenHash: hashInvitationToken(data.token),
        role: data.role,
        isSuperAdmin: data.isSuperAdmin ?? false,
        createdByUserId: data.createdByUserId,
        expiresAt: data.expiresAt,
        usedAt: null,
      },
    });
}

export async function listInvitations() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      isSuperAdmin: invitations.isSuperAdmin,
      expiresAt: invitations.expiresAt,
      usedAt: invitations.usedAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .orderBy(desc(invitations.createdAt));
}

export async function registerUserFromInvitation(data: {
  name: string;
  email: string;
  password: string;
  invitationToken: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const email = normaliseEmail(data.email);
  const invitation = await getInvitationForRegistration(email, data.invitationToken);
  if (!invitation) {
    throw new Error("Convite inválido, utilizado ou expirado");
  }

  const existingUser = await getUserByEmail(email);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
  if (isSuperAdmin && !invitation.isSuperAdmin) {
    throw new Error("O convite desta conta não autoriza acesso de super administrador");
  }

  await db.transaction(async tx => {
    if (existingUser) {
      // A valid personal invitation can activate a legacy account with the same email.
      await tx
        .update(users)
        .set({
          name: data.name.trim(),
          passwordHash,
          role: isSuperAdmin ? "admin" : invitation.role,
          isActive: true,
          isSuperAdmin: isSuperAdmin || existingUser.isSuperAdmin,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    } else {
      await tx.insert(users).values({
        name: data.name.trim(),
        email,
        passwordHash,
        role: isSuperAdmin ? "admin" : invitation.role,
        isActive: true,
        isSuperAdmin,
      });
    }

    await tx
      .update(invitations)
      .set({ usedAt: new Date() })
      .where(and(eq(invitations.id, invitation.id), isNull(invitations.usedAt)));
  });

  const user = await getUserByEmail(email);
  if (!user) throw new Error("Não foi possível criar a conta");
  return user;
}

// ============ ROUNDS ============

export async function createRound(data: {
  roundNumber: number;
  prize?: string;
  bettingDeadline: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db.insert(rounds).values(data);
}

export async function getRound(roundId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rounds).where(eq(rounds.id, roundId)).limit(1);
  return result[0];
}

export async function getRoundByNumber(roundNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(rounds)
    .where(eq(rounds.roundNumber, roundNumber))
    .limit(1);
  return result[0];
}

export async function getAllRounds() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rounds).orderBy(rounds.roundNumber);
}

// ============ MATCHES ============

export async function createMatches(
  roundId: number,
  matchesData: Array<{ homeTeam: string; awayTeam: string; matchOrder: number }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db.insert(matches).values(matchesData.map(match => ({ ...match, roundId })));
}

export async function getMatchesByRound(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).where(eq(matches.roundId, roundId)).orderBy(matches.matchOrder);
}

export async function updateMatchResult(matchId: number, result: "1" | "X" | "2") {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db.update(matches).set({ result }).where(eq(matches.id, matchId));
}

// ============ PREDICTIONS ============

export async function getPrediction(matchId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(predictions)
    .where(and(eq(predictions.matchId, matchId), eq(predictions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createOrUpdatePrediction(
  matchId: number,
  userId: number,
  prediction: "1" | "X" | "2",
) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const matchWithDeadline = await db
    .select({ deadline: rounds.bettingDeadline })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(matches.id, matchId))
    .limit(1);

  const deadline = matchWithDeadline[0]?.deadline;
  if (!deadline) throw new Error("Jogo não encontrado");
  if (new Date() >= deadline) {
    throw new Error("O prazo de apostas desta jornada já encerrou");
  }

  const existing = await getPrediction(matchId, userId);
  if (existing) {
    return db.update(predictions).set({ prediction }).where(eq(predictions.id, existing.id));
  }
  return db.insert(predictions).values({ matchId, userId, prediction });
}

export async function getPredictionsByRoundAndUser(roundId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ prediction: predictions, match: matches })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(and(eq(matches.roundId, roundId), eq(predictions.userId, userId)))
    .orderBy(matches.matchOrder);
}

export async function getPredictionsByRound(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ prediction: predictions, match: matches, user: users })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .innerJoin(users, eq(predictions.userId, users.id))
    .where(eq(matches.roundId, roundId));
}

// ============ STANDINGS AND WINNERS ============

export async function getStandings() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      correctCount: sql<number>`COUNT(CASE WHEN ${predictions.isCorrect} = 'true' THEN 1 END)`,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .where(eq(users.isActive, true))
    .groupBy(users.id)
    .orderBy(desc(sql<number>`COUNT(CASE WHEN ${predictions.isCorrect} = 'true' THEN 1 END)`));
}

export async function calculateRoundWinner(roundId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const roundMatches = await db.select().from(matches).where(eq(matches.roundId, roundId));
  if (roundMatches.length !== 6 || roundMatches.some(match => match.result === null)) {
    throw new Error("Introduza os resultados dos seis jogos antes de calcular o vencedor");
  }

  const roundPredictions = await getPredictionsByRound(roundId);
  const correctByUser = new Map<number, number>();

  for (const entry of roundPredictions) {
    const isCorrect = entry.prediction.prediction === entry.match.result;
    await db
      .update(predictions)
      .set({ isCorrect: isCorrect ? "true" : "false" })
      .where(eq(predictions.id, entry.prediction.id));
    correctByUser.set(
      entry.prediction.userId,
      (correctByUser.get(entry.prediction.userId) ?? 0) + (isCorrect ? 1 : 0),
    );
  }

  const winnerId = Array.from(correctByUser.entries()).find(([, correct]) => correct === 6)?.[0] ?? null;
  await db.update(rounds).set({ winnerId }).where(eq(rounds.id, roundId));
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
  if (!db) throw new Error("Base de dados indisponível");
  return db.insert(emailNotifications).values(data);
}

export async function markEmailAsSent(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db
    .update(emailNotifications)
    .set({ sent: "true", sentAt: new Date() })
    .where(eq(emailNotifications.id, notificationId));
}
