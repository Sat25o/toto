import { describe, expect, it } from "vitest";
import { assertRoundDeadlineCanBeUpdated } from "./roundDeadline";

describe("edição do prazo de apostas", () => {
  const now = new Date("2026-08-07T10:00:00.000Z");

  it("aceita um novo prazo futuro numa jornada aberta", () => {
    expect(() => assertRoundDeadlineCanBeUpdated(false, new Date("2026-08-07T12:00:00.000Z"), now)).not.toThrow();
  });

  it("recusa um prazo passado ou uma jornada já fechada", () => {
    expect(() => assertRoundDeadlineCanBeUpdated(false, new Date("2026-08-07T09:59:00.000Z"), now)).toThrow("novo prazo");
    expect(() => assertRoundDeadlineCanBeUpdated(true, new Date("2026-08-07T12:00:00.000Z"), now)).toThrow("jornada já fechada");
  });
});
