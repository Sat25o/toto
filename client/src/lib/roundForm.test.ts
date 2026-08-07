import { describe, expect, it } from "vitest";
import { createEmptyMatches, updateDraftMatch } from "./roundForm";

describe("formulário de jornadas", () => {
  it("cria seis jogos independentes", () => {
    const matches = createEmptyMatches();
    const updatedMatches = updateDraftMatch(matches, 0, "homeTeam", "Benfica");

    expect(updatedMatches).toHaveLength(6);
    expect(updatedMatches[0]?.homeTeam).toBe("Benfica");
    expect(updatedMatches.slice(1).every(match => match.homeTeam === "")).toBe(true);
    expect(matches[0]).not.toBe(matches[1]);
  });
});
