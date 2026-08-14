import { describe, expect, it } from "vitest";
import { addStandingMovements } from "./standingsMovement";

describe("movimento da Classificação Geral", () => {
  it("indica subida, descida e manutenção face à jornada anterior", () => {
    const previous = [
      { userId: 1, userName: "Ana", correctCount: 3 },
      { userId: 2, userName: "Bruno", correctCount: 4 },
      { userId: 3, userName: "Carlos", correctCount: 5 },
    ];
    const current = [
      { userId: 1, userName: "Ana", correctCount: 6 },
      { userId: 2, userName: "Bruno", correctCount: 5 },
      { userId: 3, userName: "Carlos", correctCount: 5 },
    ];

    expect(addStandingMovements(current, previous)).toEqual([
      expect.objectContaining({ userId: 1, position: 1, previousPosition: 3, movement: "up", positionChange: 2 }),
      expect.objectContaining({ userId: 2, position: 2, previousPosition: 2, movement: "same", positionChange: 0 }),
      expect.objectContaining({ userId: 3, position: 3, previousPosition: 1, movement: "down", positionChange: -2 }),
    ]);
  });

  it("mantém o indicador neutro quando não existe jornada anterior", () => {
    const current = [{ userId: 1, userName: "Ana", correctCount: 2 }];
    expect(addStandingMovements(current, null)[0]).toMatchObject({ movement: "same", previousPosition: null, positionChange: 0 });
  });
});
