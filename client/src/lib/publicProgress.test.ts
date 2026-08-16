import { describe, expect, it } from "vitest";
import { getActivePublicMatches, getParticipantProgress, type ProgressMatch } from "./publicProgress";

const allMatches: ProgressMatch[] = [1, 2, 3, 4, 5, 6].map(matchOrder => ({
  id: matchOrder,
  matchOrder,
  result: "1",
}));

describe("progresso público acumulado", () => {
  it("mantém o apostador a amarelo enquanto continua elegível", () => {
    const progress = getParticipantProgress(allMatches, [{ matchId: 1, prediction: "1" }], 1);
    expect(progress.status).toBe("eligible");
    expect(progress.correctCount).toBe(1);
  });

  it("elimina a vermelho no primeiro erro e mantém esse estado", () => {
    const predictions = [
      { matchId: 1, prediction: "X" as const },
      { matchId: 2, prediction: "1" as const },
    ];
    expect(getParticipantProgress(allMatches, predictions, 1).status).toBe("eliminated");
    expect(getParticipantProgress(allMatches, predictions, 2).status).toBe("eliminated");
  });

  it("marca a verde apenas quem acerta os seis resultados", () => {
    const predictions = allMatches.map(match => ({ matchId: match.id, prediction: "1" as const }));
    const progress = getParticipantProgress(allMatches, predictions);
    expect(progress.status).toBe("winner");
    expect(progress.correctCount).toBe(6);
  });

  it("ignora um jogo adiado ao apurar um boletim completo", () => {
    const matchesWithPostponed = allMatches.map(match => match.id === 6 ? { ...match, result: null, isPostponed: true } : match);
    const predictions = allMatches.slice(0, 5).map(match => ({ matchId: match.id, prediction: "1" as const }));
    const progress = getParticipantProgress(matchesWithPostponed, predictions, Number.POSITIVE_INFINITY, true);
    expect(progress.status).toBe("winner");
    expect(progress.correctCount).toBe(5);
    expect(progress.missingMatchIds).toEqual([]);
  });

  it("substitui um jogo principal adiado pelo jogo suplente", () => {
    const matchesWithBackup: ProgressMatch[] = [
      ...allMatches.map(match => match.id === 2 ? { ...match, isPostponed: true, result: null } : match),
      { id: 7, matchOrder: 7, result: "1", isBackup: true },
    ];
    const predictions = [1, 3, 4, 5, 6, 7].map(matchId => ({ matchId, prediction: "1" as const }));

    expect(getActivePublicMatches(matchesWithBackup).map(match => match.id)).toEqual([1, 3, 4, 5, 6, 7]);
    expect(getParticipantProgress(matchesWithBackup, predictions, Number.POSITIVE_INFINITY, true).status).toBe("winner");
  });

  it("elimina a vermelho quem não completou os seis palpites depois do fecho", () => {
    const progress = getParticipantProgress(allMatches, [
      { matchId: 1, prediction: "1" },
      { matchId: 2, prediction: "X" },
    ], Number.POSITIVE_INFINITY, true);

    expect(progress.status).toBe("eliminated");
    expect(progress.eliminationReason).toBe("incomplete_predictions");
    expect(progress.missingMatchIds).toEqual([3, 4, 5, 6]);
  });

  it("mantém os incompletos elegíveis antes de ser aplicado o fecho", () => {
    const matchesWithoutResults = allMatches.map(match => ({ ...match, result: null }));
    expect(getParticipantProgress(matchesWithoutResults, [{ matchId: 1, prediction: "1" }]).status).toBe("eligible");
  });
});
