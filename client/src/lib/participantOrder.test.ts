import { describe, expect, it } from "vitest";
import { putCurrentParticipantFirst } from "./participantOrder";

describe("ordem dos participantes públicos", () => {
  it("coloca o apostador autenticado no topo sem alterar a ordem dos restantes", () => {
    const ordered = putCurrentParticipantFirst([
      { id: 2, name: "Ana" },
      { id: 1, name: "Bruno" },
      { id: 3, name: "Carla" },
    ], 3);

    expect(ordered.map(participant => participant.id)).toEqual([3, 2, 1]);
  });
});
