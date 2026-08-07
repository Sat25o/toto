import { describe, expect, it } from "vitest";
import { getParticipantProgress, type ProgressMatch } from "./publicProgress";

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
});
