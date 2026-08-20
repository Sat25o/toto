import { describe, expect, it } from "vitest";
import { getBettingCountdown } from "./bettingCountdown";

describe("getBettingCountdown", () => {
  it("formats the remaining time in days when more than one day remains", () => {
    expect(getBettingCountdown("2026-08-22T14:30:00Z", new Date("2026-08-20T12:00:00Z"))).toEqual({
      isClosed: false,
      label: "2d 02h 30m",
      days: "02",
      hours: "02",
      minutes: "30",
      seconds: "00",
    });
  });

  it("formats the remaining time with hours, minutes and seconds on the final day", () => {
    expect(getBettingCountdown("2026-08-20T14:30:09Z", new Date("2026-08-20T12:00:00Z"))).toEqual({
      isClosed: false,
      label: "02:30:09",
      days: "00",
      hours: "02",
      minutes: "30",
      seconds: "09",
    });
  });

  it("reports a closed deadline", () => {
    expect(getBettingCountdown("2026-08-20T11:59:59Z", new Date("2026-08-20T12:00:00Z"))).toEqual({
      isClosed: true,
      label: "Prazo encerrado",
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    });
  });
});
