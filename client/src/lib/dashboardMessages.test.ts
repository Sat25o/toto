import { describe, expect, it } from "vitest";
import { getDashboardMessages } from "./dashboardMessages";

describe("avisos no Dashboard", () => {
  it("mostra apenas mensagens ativas e coloca as fixadas primeiro", () => {
    const messages = getDashboardMessages([
      { id: 1, title: "Antiga", content: "A", isPinned: false, isActive: true, createdAt: "2026-08-01" },
      { id: 2, title: "Fixada", content: "B", isPinned: true, isActive: true, createdAt: "2026-07-01" },
      { id: 3, title: "Oculta", content: "C", isPinned: false, isActive: false, createdAt: "2026-08-07" },
    ]);

    expect(messages.map(message => message.title)).toEqual(["Fixada", "Antiga"]);
  });
});
