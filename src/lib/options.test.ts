import { describe, expect, it } from "vitest";
import { analyze, blackScholes, entryPrice, expirationPnL, leg, positionPnL, RATE } from "./options";

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

  it("finds exact breakevens without sampling the price range", () => {
    const longCall = leg("call", 1, 100, { dte: 30, iv: 0.3 });
    const analysis = analyze([longCall], 100);
    const premium = blackScholes("call", 100, 100, 30 / 365, RATE, 0.3).price;

    expect(analysis.isExact).toBe(true);
    expect(analysis.breakevens).toEqual([expect.closeTo(100 + premium, 6)]);
    expect(analysis.maxProfit).toBe(Infinity);
    expect(analysis.maxLoss).toBeCloseTo(-premium * 100, 6);
  });

  it("recognizes unlimited upside loss for a call ratio", () => {
    const analysis = analyze([leg("call", 1, 100), leg("call", -1, 110, { qty: 2 })], 100);

    expect(analysis.maxLoss).toBe(-Infinity);
    expect(analysis.maxProfit).toBeGreaterThan(0);
  });

  it("does not claim exact max profit or loss for mixed expiries", () => {
    const analysis = analyze([leg("call", -1, 100, { dte: 30 }), leg("call", 1, 100, { dte: 60 })], 100);

    expect(analysis).toMatchObject({ isExact: false, maxProfit: null, maxLoss: null, breakevens: [] });
  });

  it("uses intrinsic values at exact expiration", () => {
    const longPut = leg("put", 1, 100);
    const premium = blackScholes("put", 100, 100, 30 / 365, RATE, 0.3).price;

    expect(expirationPnL([longPut], 100, 80)).toBeCloseTo((20 - premium) * 100, 6);
  });

  it("uses an entered fill instead of the theoretical entry price", () => {
    const longCall = leg("call", 1, 100, { entryPremium: 2 });

    expect(positionPnL([longCall], 100, 105, 30)).toBeCloseTo(300, 6);
  });

  it("applies the selected interest rate to theoretical prices", () => {
    const call = leg("call", 1, 100, { dte: 90, iv: 0.3 });
    const put = leg("put", 1, 100, { dte: 90, iv: 0.3 });

    expect(entryPrice(call, 100, 0.1)).toBeGreaterThan(entryPrice(call, 100, 0));
    expect(entryPrice(put, 100, 0.1)).toBeLessThan(entryPrice(put, 100, 0));
  });
});
