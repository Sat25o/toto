import { describe, expect, it } from "vitest";
import { getRoundResultClearUpdates } from "./resultClearing";

describe("getRoundResultClearUpdates", () => {
  it("limpa os resultados e repõe o estado dos palpites sem os apagar", () => {
    expect(getRoundResultClearUpdates(false)).toEqual({
      matchUpdate: { result: null },
      predictionUpdate: { isCorrect: "pending" },
    });
  });

  it("não permite limpar os resultados de uma jornada já fechada", () => {
    expect(() => getRoundResultClearUpdates(true)).toThrow("A jornada já foi fechada");
  });
});
