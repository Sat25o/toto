import { describe, expect, it } from "vitest";
import { createEmptyMatches, LIGA_BETCLIC_TEAMS, updateDraftMatch } from "./roundForm";

describe("formulário de jornadas", () => {
  it("cria seis jogos principais e um suplente independentes", () => {
    const matches = createEmptyMatches();
    const updatedMatches = updateDraftMatch(matches, 0, "homeTeam", "Benfica");

    expect(updatedMatches).toHaveLength(7);
    expect(updatedMatches[0]?.homeTeam).toBe("Benfica");
    expect(updatedMatches.slice(1).every(match => match.homeTeam === "")).toBe(true);
    expect(matches[0]).not.toBe(matches[1]);
  });

  it("disponibiliza as 18 equipas da Liga Betclic nos jogos principais", () => {
    expect(LIGA_BETCLIC_TEAMS).toHaveLength(18);
    expect(LIGA_BETCLIC_TEAMS).toContain("Benfica");
    expect(LIGA_BETCLIC_TEAMS).toContain("Sporting CP");
  });
});
