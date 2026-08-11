import { describe, expect, it } from "vitest";
import { assertRoundMatchesAreEditable } from "./matchEditing";

const now = new Date("2026-08-11T12:00:00.000Z");
const futureDeadline = new Date("2026-08-12T12:00:00.000Z");

describe("assertRoundMatchesAreEditable", () => {
  it("permite corrigir os jogos antes de qualquer participação ou resultado", () => {
    expect(() =>
      assertRoundMatchesAreEditable({
        isSettled: false,
        bettingDeadline: futureDeadline,
        hasPredictions: false,
        hasOfficialResults: false,
        now,
      }),
    ).not.toThrow();
  });

  it.each([
    ["a jornada já foi fechada", { isSettled: true, bettingDeadline: futureDeadline, hasPredictions: false, hasOfficialResults: false }],
    ["o prazo de apostas já passou", { isSettled: false, bettingDeadline: now, hasPredictions: false, hasOfficialResults: false }],
    ["já existem palpites", { isSettled: false, bettingDeadline: futureDeadline, hasPredictions: true, hasOfficialResults: false }],
    ["já existem resultados", { isSettled: false, bettingDeadline: futureDeadline, hasPredictions: false, hasOfficialResults: true }],
  ])("recusa a alteração quando %s", (_reason, input) => {
    expect(() => assertRoundMatchesAreEditable({ ...input, now })).toThrow();
  });
});
