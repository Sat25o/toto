import { describe, expect, it } from "vitest";
import { assertRoundResultsAreEditable } from "./resultEditing";

describe("correção de resultados", () => {
  const deadline = new Date("2026-08-22T14:30:00.000Z");

  it("permite corrigir resultados depois de fechado o prazo de apostas", () => {
    expect(() => assertRoundResultsAreEditable(false, deadline, new Date("2026-08-22T14:30:00.000Z"))).not.toThrow();
  });

  it("bloqueia resultados depois do fecho da jornada", () => {
    expect(() => assertRoundResultsAreEditable(true, deadline, new Date("2026-08-22T16:00:00.000Z"))).toThrow("já foi fechada");
  });

  it("bloqueia resultados enquanto as apostas estiverem abertas", () => {
    expect(() => assertRoundResultsAreEditable(false, deadline, new Date("2026-08-22T14:29:59.000Z"))).toThrow("só podem ser geridos");
  });
});
