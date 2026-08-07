import { describe, expect, it } from "vitest";
import { shouldShowParticipant } from "./participantFilters";

describe("filtros de apostadores públicos", () => {
  it("encontra nomes sem distinguir acentos e filtra pelo estado acumulado", () => {
    expect(shouldShowParticipant("Ricardo Nascimento", "eligible", "ricardo", "all")).toBe(true);
    expect(shouldShowParticipant("João Silva", "winner", "joao", "winner")).toBe(true);
    expect(shouldShowParticipant("João Silva", "winner", "joao", "eliminated")).toBe(false);
  });
});
