import { describe, expect, it } from "vitest";
import { assertRoundHistoryIsAvailable } from "./historyAccess";

describe("assertRoundHistoryIsAvailable", () => {
  it("permite consultar os palpites de uma jornada finalizada", () => {
    expect(() => assertRoundHistoryIsAvailable(true)).not.toThrow();
  });

  it("impede a consulta dos palpites de uma jornada ainda aberta", () => {
    expect(() => assertRoundHistoryIsAvailable(false)).toThrow(
      "O histórico detalhado fica disponível depois de a jornada ser finalizada",
    );
  });
});
