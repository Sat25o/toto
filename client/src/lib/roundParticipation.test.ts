import { describe, expect, it } from "vitest";
import { splitRoundParticipation } from "./roundParticipation";

describe("participação na jornada", () => {
  it("separa quem concluiu 6/6 de quem ainda tem palpites em falta", () => {
    const result = splitRoundParticipation([
      { userId: 1, userName: "Ana", userEmail: "ana@exemplo.com", predictionCount: "6" },
      { userId: 2, userName: "Bruno", userEmail: "bruno@exemplo.com", predictionCount: "3" },
      { userId: 3, userName: "Carla", userEmail: "carla@exemplo.com", predictionCount: "0" },
    ], 6);

    expect(result.completed.map(item => item.userName)).toEqual(["Ana"]);
    expect(result.pending.map(item => item.userName)).toEqual(["Bruno", "Carla"]);
  });
});
