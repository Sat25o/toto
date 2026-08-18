import { assertRoundResultsAreEditable } from "./resultEditing";

/** Define a reposição segura de resultados sem apagar os palpites dos participantes. */
export function getRoundResultClearUpdates(isSettled: boolean) {
  assertRoundResultsAreEditable(isSettled);

  return {
    matchUpdate: { result: null },
    predictionUpdate: { isCorrect: "pending" as const },
  };
}
