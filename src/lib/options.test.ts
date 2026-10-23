import { describe, expect, it } from "vitest";
import { blackScholes, leg, positionPnL, RATE, analyze } from "./options";

describe("options math", () => {
  it("satisfies put-call parity", () => {
    const c = blackScholes("call", 100, 100, 0.5, RATE, 0.25).price;
    const p = blackScholes("put", 100, 100, 0.5, RATE, 0.25).price;
    expect(c - p).toBeCloseTo(100 - 100 * Math.exp(-RATE * 0.5), 6);
  });

  it("long call at expiry pays intrinsic minus premium, times 100", () => {
    const l = leg("call", 1, 100);
    const prem = blackScholes("call", 100, 100, 30 / 365, RATE, 0.3).price;
    expect(positionPnL([l], 100, 120, 30)).toBeCloseTo((20 - prem) * 100, 4);
  });

  it("bull call spread has capped profit and loss", () => {
    const a = analyze([leg("call", 1, 100), leg("call", -1, 110)], 100);
    expect(isFinite(a.maxProfit)).toBe(true);
    expect(a.maxProfit + -a.maxLoss).toBeCloseTo(1000, 0);
  });
});
