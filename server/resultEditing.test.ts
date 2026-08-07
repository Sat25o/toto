import { describe, expect, it } from "vitest";
import { assertRoundResultsAreEditable } from "./resultEditing";

describe("correção de resultados", () => {
  it("permite corrigir resultados antes de a jornada ser fechada", () => {
    expect(() => assertRoundResultsAreEditable(false)).not.toThrow();
  });

  it("bloqueia resultados depois do fecho da jornada", () => {
    expect(() => assertRoundResultsAreEditable(true)).toThrow("já foi fechada");
  });
});
