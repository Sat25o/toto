import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { calculateEqualPrizeShare } from "./settlement";
import { assertUserCanBeDeleted } from "./userDeletion";
import { assertRoundResultsAreEditable } from "./resultEditing";
import { assertRoundDeadlineCanBeUpdated } from "./roundDeadline";
import { assertRoundMatchesAreEditable } from "./matchEditing";
import { CHAMPIONS_LEAGUE_EDITION, CHAMPIONS_LEAGUE_QUALIFICATION_ROUND, CHAMPIONS_LEAGUE_QUALIFIED_COUNT, STANDINGS_START_ROUND } from "../shared/league";
import { buildChampionsLeagueFixtures } from "./championsLeagueBracket";
import {
  adminMessages,
  championsLeagueEntries,
  championsLeagueMatches,
  emailNotifications,
  invitations,
  leagueRules,
  matches,
  predictions,
  rounds,
  roundWinners,
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
      mustChangePassword: users.mustChangePassword,
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

export async function updateUserProfile(userId: number, data: { name: string; role: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");
  if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
    throw new Error("O perfil do super administrador não pode ser alterado nesta área");
  }

  await db.update(users).set({ name: data.name.trim(), role: data.role }).where(eq(users.id, userId));
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

/** Defines a one-time provisional password and requires the participant to replace it on the next access. */
export async function setTemporaryPassword(userId: number, temporaryPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");
  if (target.isSuperAdmin || target.email === SUPER_ADMIN_EMAIL) {
    throw new Error("A palavra-passe do super administrador não pode ser redefinida desta forma");
  }

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await db.update(users).set({ passwordHash, mustChangePassword: true }).where(eq(users.id, userId));
}

/** Replaces a provisional password with the participant's own password. */
export async function changeOwnPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash, mustChangePassword: false }).where(eq(users.id, userId));
}

/** Removes an account and its personal competition data. This operation is irreversible. */
export async function deleteUser(userId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const target = await getUserById(userId);
  if (!target) throw new Error("Utilizador não encontrado");
  assertUserCanBeDeleted(target, actorUserId, SUPER_ADMIN_EMAIL);

  await db.transaction(async tx => {
    await tx.delete(predictions).where(eq(predictions.userId, userId));
    await tx.delete(roundWinners).where(eq(roundWinners.userId, userId));
    await tx.delete(emailNotifications).where(eq(emailNotifications.userId, userId));
    await tx.delete(invitations).where(eq(invitations.email, target.email));
    await tx.update(rounds).set({ winnerId: null }).where(eq(rounds.winnerId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });
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
    .where(isNull(invitations.usedAt))
    .orderBy(desc(invitations.createdAt));
}

export async function deleteInvitation(invitationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  await db.delete(invitations).where(and(eq(invitations.id, invitationId), isNull(invitations.usedAt)));
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
  prizeAmount?: number;
  bettingDeadline: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  return db.insert(rounds).values({
    roundNumber: data.roundNumber,
    prize: data.prize,
    prizeAmount: data.prizeAmount?.toFixed(2),
    bettingDeadline: data.bettingDeadline,
  });
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

export async function updateRoundDeadline(roundId: number, bettingDeadline: Date) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const round = await getRound(roundId);
  if (!round) throw new Error("Jornada não encontrada");
  assertRoundDeadlineCanBeUpdated(round.isSettled, bettingDeadline);

  await db.update(rounds).set({ bettingDeadline }).where(eq(rounds.id, roundId));
  return getRound(roundId);
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

export async function updateRoundMatches(
  roundId: number,
  matchesData: Array<{ id: number; homeTeam: string; awayTeam: string }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const round = await getRound(roundId);
  if (!round) throw new Error("Jornada não encontrada");

  const currentMatches = await getMatchesByRound(roundId);
  const currentMatchIds = new Set(currentMatches.map(match => match.id));
  const submittedMatchIds = new Set(matchesData.map(match => match.id));
  if (
    currentMatches.length !== 6 ||
    matchesData.length !== 6 ||
    submittedMatchIds.size !== 6 ||
    Array.from(submittedMatchIds).some(matchId => !currentMatchIds.has(matchId))
  ) {
    throw new Error("Os seis jogos da jornada têm de ser enviados corretamente");
  }

  const predictionCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(eq(matches.roundId, roundId));

  assertRoundMatchesAreEditable({
    isSettled: round.isSettled,
    bettingDeadline: round.bettingDeadline,
    hasPredictions: Number(predictionCount[0]?.count ?? 0) > 0,
    hasOfficialResults: currentMatches.some(match => match.result !== null),
  });

  await db.transaction(async tx => {
    await Promise.all(
      matchesData.map(match =>
        tx
          .update(matches)
          .set({ homeTeam: match.homeTeam.trim(), awayTeam: match.awayTeam.trim() })
          .where(and(eq(matches.id, match.id), eq(matches.roundId, roundId))),
      ),
    );
  });

  return getMatchesByRound(roundId);
}

export async function updateMatchResult(matchId: number, result: "1" | "X" | "2") {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const matchRound = await db
    .select({ isSettled: rounds.isSettled })
    .from(matches)
    .innerJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!matchRound[0]) throw new Error("Jogo não encontrado");
  assertRoundResultsAreEditable(matchRound[0].isSettled);

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

export async function getRoundParticipation(roundId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      predictionCount: sql<number>`COUNT(${matches.id})`,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .leftJoin(matches, and(eq(matches.id, predictions.matchId), eq(matches.roundId, roundId)))
    .where(eq(users.isActive, true))
    .groupBy(users.id)
    .orderBy(users.name);
}

export async function getPublicRoundProgress(roundId: number) {
  const [roundMatches, participants, roundPredictions] = await Promise.all([
    getMatchesByRound(roundId),
    listUsers(),
    getPredictionsByRound(roundId),
  ]);

  const predictionByParticipantAndMatch = new Map(
    roundPredictions.map(entry => [
      `${entry.prediction.userId}:${entry.match.id}`,
      entry.prediction.prediction,
    ]),
  );

  return {
    matches: roundMatches,
    participants: participants
      .filter(participant => participant.isActive)
      .map(participant => ({
        id: participant.id,
        name: participant.name,
        predictions: roundMatches.map(match => ({
          matchId: match.id,
          prediction: predictionByParticipantAndMatch.get(`${participant.id}:${match.id}`) ?? null,
        })),
      })),
  };
}

export async function getRoundWinners(roundId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: roundWinners.userId,
      userName: users.name,
      userEmail: users.email,
      prizeShare: roundWinners.prizeShare,
    })
    .from(roundWinners)
    .innerJoin(users, eq(roundWinners.userId, users.id))
    .where(eq(roundWinners.roundId, roundId))
    .orderBy(users.name);
}

// ============ STANDINGS AND WINNERS ============

export async function getStandings() {
  const db = await getDb();
  if (!db) return [];
  const correctCount = sql<number>`COUNT(CASE WHEN ${rounds.roundNumber} >= ${STANDINGS_START_ROUND} AND ${rounds.isSettled} = true AND ${predictions.isCorrect} = 'true' THEN 1 END)`;
  return db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      correctCount,
    })
    .from(users)
    .leftJoin(predictions, eq(predictions.userId, users.id))
    .leftJoin(matches, eq(predictions.matchId, matches.id))
    .leftJoin(rounds, eq(matches.roundId, rounds.id))
    .where(eq(users.isActive, true))
    .groupBy(users.id)
    .orderBy(desc(correctCount), users.name);
}

export async function getChampionsLeagueBracket() {
  const db = await getDb();
  if (!db) return { entries: [], matches: [] };

  const entries = await db
    .select({
      id: championsLeagueEntries.id,
      seed: championsLeagueEntries.seed,
      qualificationScore: championsLeagueEntries.qualificationScore,
      userId: championsLeagueEntries.userId,
      userName: users.name,
    })
    .from(championsLeagueEntries)
    .innerJoin(users, eq(championsLeagueEntries.userId, users.id))
    .where(eq(championsLeagueEntries.edition, CHAMPIONS_LEAGUE_EDITION))
    .orderBy(asc(championsLeagueEntries.seed));

  const matchesData = await db
    .select()
    .from(championsLeagueMatches)
    .where(eq(championsLeagueMatches.edition, CHAMPIONS_LEAGUE_EDITION))
    .orderBy(asc(championsLeagueMatches.roundNumber), asc(championsLeagueMatches.matchOrder));

  const entriesById = new Map(entries.map(entry => [entry.id, entry]));
  return {
    entries,
    matches: matchesData.map(match => ({
      ...match,
      homeEntry: match.homeEntryId === null ? null : entriesById.get(match.homeEntryId) ?? null,
      awayEntry: match.awayEntryId === null ? null : entriesById.get(match.awayEntryId) ?? null,
      winnerEntry: match.winnerEntryId === null ? null : entriesById.get(match.winnerEntryId) ?? null,
    })),
  };
}

/** Cria uma única vez os 16 qualificados e o quadro base quando a Jornada 13 é finalizada. */
export async function generateChampionsLeagueBracket() {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const existingEntries = await db
    .select({ id: championsLeagueEntries.id })
    .from(championsLeagueEntries)
    .where(eq(championsLeagueEntries.edition, CHAMPIONS_LEAGUE_EDITION))
    .limit(1);
  if (existingEntries.length > 0) return getChampionsLeagueBracket();

  const standings = await getStandings();
  const qualifiers = standings.slice(0, CHAMPIONS_LEAGUE_QUALIFIED_COUNT);
  if (qualifiers.length < CHAMPIONS_LEAGUE_QUALIFIED_COUNT) return null;

  await db.transaction(async tx => {
    await tx.insert(championsLeagueEntries).values(
      qualifiers.map((qualifier, index) => ({
        edition: CHAMPIONS_LEAGUE_EDITION,
        userId: qualifier.userId,
        seed: index + 1,
        qualificationScore: Number(qualifier.correctCount),
      })),
    );

    const savedEntries = await tx
      .select({ id: championsLeagueEntries.id, seed: championsLeagueEntries.seed })
      .from(championsLeagueEntries)
      .where(eq(championsLeagueEntries.edition, CHAMPIONS_LEAGUE_EDITION))
      .orderBy(asc(championsLeagueEntries.seed));

    await tx.insert(championsLeagueMatches).values(
      buildChampionsLeagueFixtures(savedEntries).map(fixture => ({ edition: CHAMPIONS_LEAGUE_EDITION, ...fixture })),
    );
  });

  return getChampionsLeagueBracket();
}

export async function calculateRoundWinner(roundId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");

  const round = await getRound(roundId);
  if (!round) throw new Error("Jornada não encontrada");
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

  const winnerIds = Array.from(correctByUser.entries())
    .filter(([, correct]) => correct === 6)
    .map(([userId]) => userId);
  const prizeAmount = round.prizeAmount === null ? null : Number(round.prizeAmount);
  const prizeShare = calculateEqualPrizeShare(prizeAmount, winnerIds.length);

  await db.transaction(async tx => {
    await tx.delete(roundWinners).where(eq(roundWinners.roundId, roundId));
    if (winnerIds.length > 0) {
      await tx.insert(roundWinners).values(
        winnerIds.map(userId => ({
          roundId,
          userId,
          prizeShare: prizeShare?.toFixed(2),
        })),
      );
    }
    await tx
      .update(rounds)
      .set({ winnerId: winnerIds[0] ?? null, isSettled: true })
      .where(eq(rounds.id, roundId));
  });

  if (round.roundNumber === CHAMPIONS_LEAGUE_QUALIFICATION_ROUND) {
    await generateChampionsLeagueBracket();
  }

  return { winnerIds, winnerCount: winnerIds.length, prizeAmount, prizeShare };
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

// ============ LEAGUE RULES =========

export async function listLeagueRules(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(leagueRules);
  return includeInactive
    ? query.orderBy(leagueRules.displayOrder)
    : query.where(eq(leagueRules.isActive, true)).orderBy(leagueRules.displayOrder);
}

export async function createLeagueRule(content: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  const existingRules = await listLeagueRules(true);
  const displayOrder = existingRules.reduce((highestOrder, rule) => Math.max(highestOrder, rule.displayOrder), 0) + 1;
  await db.insert(leagueRules).values({ content: content.trim(), displayOrder });
}

export async function updateLeagueRule(ruleId: number, data: { content: string; isActive: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  await db.update(leagueRules).set({ content: data.content.trim(), isActive: data.isActive }).where(eq(leagueRules.id, ruleId));
}

export async function deleteLeagueRule(ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  await db.delete(leagueRules).where(eq(leagueRules.id, ruleId));
}

// ============ ADMIN MESSAGES =========

export async function listAdminMessages(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(adminMessages);
  return includeInactive
    ? query.orderBy(desc(adminMessages.isPinned), desc(adminMessages.createdAt))
    : query.where(eq(adminMessages.isActive, true)).orderBy(desc(adminMessages.isPinned), desc(adminMessages.createdAt));
}

export async function createAdminMessage(data: {
  title: string;
  content: string;
  isPinned: boolean;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  await db.insert(adminMessages).values({
    title: data.title.trim(),
    content: data.content.trim(),
    isPinned: data.isPinned,
    createdByUserId: data.createdByUserId,
  });
}

export async function updateAdminMessage(messageId: number, data: {
  title: string;
  content: string;
  isPinned: boolean;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  await db.update(adminMessages).set({
    title: data.title.trim(),
    content: data.content.trim(),
    isPinned: data.isPinned,
    isActive: data.isActive,
  }).where(eq(adminMessages.id, messageId));
}

export async function deleteAdminMessage(messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de dados indisponível");
  await db.delete(adminMessages).where(eq(adminMessages.id, messageId));
}
