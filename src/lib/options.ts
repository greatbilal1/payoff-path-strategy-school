export type LegType = "call" | "put" | "stock";

export interface Leg {
  id: string;
  type: LegType;
  side: 1 | -1; // 1 = long (buy), -1 = short (sell)
  qty: number; // contracts for options, shares for stock
  strike: number;
  dte: number; // days to expiration at entry
  iv: number; // implied volatility, decimal (0.3 = 30%)
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // per calendar day
  vega: number; // per 1 vol point
}

export const MULT = 100;
export const RATE = 0.04;

function erf(x: number) {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return s * y;
}
export const normCdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
export const normPdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/** Black-Scholes price and Greeks for a single long option (per share). */
export function blackScholes(
  type: "call" | "put",
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
): Greeks {
  if (T <= 1e-6 || sigma <= 0) {
    const intrinsic = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    const itm = type === "call" ? S > K : S < K;
    return { price: intrinsic, delta: itm ? (type === "call" ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const disc = K * Math.exp(-r * T);
  const gamma = normPdf(d1) / (S * sigma * sqrtT);
  const vega = (S * normPdf(d1) * sqrtT) / 100;
  const decay = (-S * normPdf(d1) * sigma) / (2 * sqrtT);
  if (type === "call") {
    return {
      price: S * normCdf(d1) - disc * normCdf(d2),
      delta: normCdf(d1),
      gamma,
      theta: (decay - r * disc * normCdf(d2)) / 365,
      vega,
    };
  }
  return {
    price: disc * normCdf(-d2) - S * normCdf(-d1),
    delta: normCdf(d1) - 1,
    gamma,
    theta: (decay + r * disc * normCdf(-d2)) / 365,
    vega,
  };
}

const mult = (l: Leg) => (l.type === "stock" ? 1 : MULT);

/** Value + greeks of one leg (per share) at a given underlying price, time elapsed and IV shift. */
export function legGreeks(l: Leg, S: number, elapsed: number, ivShift = 0): Greeks {
  if (l.type === "stock") return { price: S, delta: 1, gamma: 0, theta: 0, vega: 0 };
  const T = Math.max(0, l.dte - elapsed) / 365;
  return blackScholes(l.type, S, l.strike, T, RATE, Math.max(0.01, l.iv + ivShift));
}

/** Entry cost per share: options priced with Black-Scholes at entry spot; stock at entry spot. */
export function entryPrice(l: Leg, entrySpot: number) {
  return legGreeks(l, entrySpot, 0).price;
}

export function positionPnL(legs: Leg[], entrySpot: number, S: number, elapsed: number, ivShift = 0) {
  return legs.reduce((acc, l) => {
    const now = legGreeks(l, S, elapsed, ivShift).price;
    return acc + l.side * l.qty * mult(l) * (now - entryPrice(l, entrySpot));
  }, 0);
}

export function positionGreeks(legs: Leg[], S: number, elapsed: number, ivShift = 0): Greeks {
  const g = { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
  for (const l of legs) {
    const lg = legGreeks(l, S, elapsed, ivShift);
    const m = l.side * l.qty * mult(l);
    g.price += m * lg.price;
    g.delta += m * lg.delta;
    g.gamma += m * lg.gamma;
    g.theta += m * lg.theta;
    g.vega += m * lg.vega;
  }
  return g;
}

/** Net debit (+) or credit (-) to open the position. */
export function netCost(legs: Leg[], entrySpot: number) {
  return legs.reduce((a, l) => a + l.side * l.qty * mult(l) * entryPrice(l, entrySpot), 0);
}

/** Days until the first leg expires (the "expiration" view). */
export function firstExpiry(legs: Leg[]) {
  const opts = legs.filter((l) => l.type !== "stock");
  return opts.length ? Math.min(...opts.map((l) => l.dte)) : 30;
}

export function analyze(legs: Leg[], entrySpot: number) {
  const exp = firstExpiry(legs);
  const lo = 0.01;
  const hi = entrySpot * 4;
  const n = 800;
  let max = -Infinity;
  let min = Infinity;
  const be: number[] = [];
  let prev = positionPnL(legs, entrySpot, lo, exp);
  for (let i = 1; i <= n; i++) {
    const S = lo + ((hi - lo) * i) / n;
    const v = positionPnL(legs, entrySpot, S, exp);
    max = Math.max(max, v);
    min = Math.min(min, v);
    if ((prev < 0 && v >= 0) || (prev > 0 && v <= 0)) be.push(S);
    prev = v;
  }
  const slopeHi = positionPnL(legs, entrySpot, hi, exp) - positionPnL(legs, entrySpot, hi * 0.99, exp);
  const unlimitedUp = slopeHi > 1;
  const unlimitedDown = slopeHi < -1;
  return {
    maxProfit: unlimitedUp ? Infinity : max,
    maxLoss: unlimitedDown ? -Infinity : Math.min(min, positionPnL(legs, entrySpot, lo, exp)),
    breakevens: be,
  };
}

let idc = 0;
export const uid = () => `leg${++idc}${Math.random().toString(36).slice(2, 6)}`;

export function leg(type: LegType, side: 1 | -1, strike: number, opts: Partial<Leg> = {}): Leg {
  return { id: uid(), type, side, qty: type === "stock" ? 100 : 1, strike, dte: 30, iv: 0.3, ...opts };
}

export interface Preset {
  id: string;
  name: string;
  outlook: string;
  build: (S: number) => Leg[];
}

const r5 = (x: number) => Math.round(x / 5) * 5;

export const PRESETS: Preset[] = [
  { id: "long-call", name: "Long Call", outlook: "Bullish", build: (S) => [leg("call", 1, r5(S))] },
  { id: "long-put", name: "Long Put", outlook: "Bearish", build: (S) => [leg("put", 1, r5(S))] },
  { id: "short-call", name: "Naked Short Call", outlook: "Bearish / neutral", build: (S) => [leg("call", -1, r5(S * 1.05))] },
  { id: "short-put", name: "Cash-Secured Put", outlook: "Neutral / bullish", build: (S) => [leg("put", -1, r5(S * 0.95))] },
  { id: "covered-call", name: "Covered Call", outlook: "Neutral / mildly bullish", build: (S) => [leg("stock", 1, S), leg("call", -1, r5(S * 1.05))] },
  { id: "protective-put", name: "Protective Put", outlook: "Bullish with insurance", build: (S) => [leg("stock", 1, S), leg("put", 1, r5(S * 0.95))] },
  { id: "collar", name: "Collar", outlook: "Hedged long", build: (S) => [leg("stock", 1, S), leg("put", 1, r5(S * 0.95)), leg("call", -1, r5(S * 1.05))] },
  { id: "bull-call", name: "Bull Call Spread", outlook: "Moderately bullish", build: (S) => [leg("call", 1, r5(S)), leg("call", -1, r5(S * 1.1))] },
  { id: "bear-put", name: "Bear Put Spread", outlook: "Moderately bearish", build: (S) => [leg("put", 1, r5(S)), leg("put", -1, r5(S * 0.9))] },
  { id: "bull-put", name: "Bull Put Credit Spread", outlook: "Neutral / bullish", build: (S) => [leg("put", -1, r5(S * 0.95)), leg("put", 1, r5(S * 0.9))] },
  { id: "straddle", name: "Long Straddle", outlook: "Big move, either way", build: (S) => [leg("call", 1, r5(S)), leg("put", 1, r5(S))] },
  { id: "strangle", name: "Long Strangle", outlook: "Big move, cheaper", build: (S) => [leg("call", 1, r5(S * 1.05)), leg("put", 1, r5(S * 0.95))] },
  { id: "short-straddle", name: "Short Straddle", outlook: "Pinned / low vol", build: (S) => [leg("call", -1, r5(S)), leg("put", -1, r5(S))] },
  { id: "iron-condor", name: "Iron Condor", outlook: "Range-bound", build: (S) => [leg("put", 1, r5(S * 0.85)), leg("put", -1, r5(S * 0.92)), leg("call", -1, r5(S * 1.08)), leg("call", 1, r5(S * 1.15))] },
  { id: "butterfly", name: "Call Butterfly", outlook: "Pin at target", build: (S) => [leg("call", 1, r5(S * 0.95)), leg("call", -1, r5(S), { qty: 2 }), leg("call", 1, r5(S * 1.05))] },
  { id: "calendar", name: "Call Calendar", outlook: "Neutral, rising IV", build: (S) => [leg("call", -1, r5(S), { dte: 30 }), leg("call", 1, r5(S), { dte: 60 })] },
  { id: "ratio", name: "1x2 Call Ratio", outlook: "Mildly bullish", build: (S) => [leg("call", 1, r5(S)), leg("call", -1, r5(S * 1.08), { qty: 2 })] },
  { id: "risk-reversal", name: "Risk Reversal", outlook: "Synthetic-ish bullish", build: (S) => [leg("put", -1, r5(S * 0.95)), leg("call", 1, r5(S * 1.05))] },
];

export const presetById = (id: string) => PRESETS.find((p) => p.id === id);

export const fmt$ = (v: number) =>
  !isFinite(v) ? (v > 0 ? "Unlimited" : "-Unlimited") : `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
