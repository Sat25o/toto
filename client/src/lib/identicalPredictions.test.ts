import { describe, expect, it } from "vitest";
import { findIdenticalPredictionGroups } from "./identicalPredictions";

const matches = [
  { id: 11, matchOrder: 1 },
  { id: 12, matchOrder: 2 },
  { id: 13, matchOrder: 3 },
  { id: 14, matchOrder: 4 },
  { id: 15, matchOrder: 5 },
  { id: 16, matchOrder: 6 },
];

describe("findIdenticalPredictionGroups", () => {
  it("agrupa apenas participantes com os seis palpites exatamente iguais", () => {
    const groups = findIdenticalPredictionGroups(matches, [
      {
        id: 1,
        name: "David",
        predictions: [
          { matchId: 11, prediction: "1" }, { matchId: 12, prediction: "X" }, { matchId: 13, prediction: "2" },
          { matchId: 14, prediction: "1" }, { matchId: 15, prediction: "X" }, { matchId: 16, prediction: "2" },
        ],
      },
      {
        id: 2,
        name: "Carlos",
        predictions: [
          { matchId: 16, prediction: "2" }, { matchId: 15, prediction: "X" }, { matchId: 14, prediction: "1" },
          { matchId: 13, prediction: "2" }, { matchId: 12, prediction: "X" }, { matchId: 11, prediction: "1" },
        ],
      },
      {
        id: 3,
        name: "Nuno",
        predictions: [
          { matchId: 11, prediction: "1" }, { matchId: 12, prediction: "X" }, { matchId: 13, prediction: "2" },
          { matchId: 14, prediction: "1" }, { matchId: 15, prediction: "X" },
        ],
      },
    ]);

    expect(groups).toEqual([
      {
        predictions: ["1", "X", "2", "1", "X", "2"],
        participants: [{ id: 1, name: "David" }, { id: 2, name: "Carlos" }],
      },
    ]);
  });

  it("mantém grupos diferentes de boletins iguais", () => {
    const groups = findIdenticalPredictionGroups(matches, [
      { id: 1, name: "A", predictions: matches.map(match => ({ matchId: match.id, prediction: "1" as const })) },
      { id: 2, name: "B", predictions: matches.map(match => ({ matchId: match.id, prediction: "1" as const })) },
      { id: 3, name: "C", predictions: matches.map(match => ({ matchId: match.id, prediction: "X" as const })) },
      { id: 4, name: "D", predictions: matches.map(match => ({ matchId: match.id, prediction: "X" as const })) },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map(group => group.participants.map(participant => participant.name))).toEqual([["A", "B"], ["C", "D"]]);
  });
});
