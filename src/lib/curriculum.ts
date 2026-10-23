import { leg, presetById, type Leg } from "./options";
import type { Metric } from "@/components/PayoffChart";

export type Level = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

export interface Lesson {
  id: string;
  level: Level;
  title: string;
  summary: string;
  minutes: number;
  lab: { title: string; build: (S: number) => Leg[]; metric?: Metric };
  sections: { h: string; p: string[] }[];
  example: { title: string; lines: string[] };
  tryIt: string[];
  takeaways: string[];
  quiz: { q: string; options: string[]; answer: number; explain: string };
}

const P = (id: string) => presetById(id)!.build;

export const LESSONS: Lesson[] = [
  // ───────────── BEGINNER ─────────────
  {
    id: "what-is-an-option",
    level: "Beginner",
    title: "What is an option?",
    summary: "Rights vs. obligations, calls vs. puts, and the 100-share contract.",
    minutes: 8,
    lab: { title: "Long 100 Call", build: P("long-call") },
    sections: [
      { h: "A contract on a price", p: [
        "An option is a contract that gives its buyer the right — but not the obligation — to buy or sell an underlying asset at a fixed price (the strike) on or before a set date (the expiration).",
        "A call gives the right to buy. A put gives the right to sell. The buyer pays a premium for that right; the seller collects the premium and takes on the obligation.",
      ]},
      { h: "Contract size", p: [
        "In US equity options, one contract controls 100 shares. A premium quoted at $3.20 costs $320 per contract. Every P&L number in the lab already includes this ×100 multiplier.",
      ]},
      { h: "Four basic positions", p: [
        "Long call (bullish), long put (bearish), short call (neutral to bearish, obligated to sell), short put (neutral to bullish, obligated to buy). Every complex strategy is built from these four bricks.",
      ]},
    ],
    example: { title: "Buying a call on XYZ at $100", lines: [
      "Buy 1 XYZ 100-strike call, 30 days out, for ~$3.60 → cost $360.",
      "At expiration XYZ = $110 → call worth $10 → value $1,000 → profit $640.",
      "At expiration XYZ = $95 → call worthless → loss limited to $360.",
    ]},
    tryIt: ["Drag 'Underlying move' to +10% and watch the P&L.", "Move 'Days passed' to the end — the dashed line collapses onto the solid hockey stick."],
    takeaways: ["Buyers have rights, sellers have obligations.", "1 contract = 100 shares.", "A long option's max loss is the premium paid."],
    quiz: { q: "You buy one call for $2.50. What is your maximum loss?", options: ["$2.50", "$250", "Unlimited", "The strike × 100"], answer: 1, explain: "Premium × 100 shares = $250. A long option can never lose more than what you paid." },
  },
  {
    id: "moneyness-intrinsic-extrinsic",
    level: "Beginner",
    title: "Moneyness, intrinsic & time value",
    summary: "ITM, ATM, OTM — and why an option is worth more than its intrinsic value.",
    minutes: 9,
    lab: { title: "Long 100 Put", build: P("long-put") },
    sections: [
      { h: "Moneyness", p: [
        "A call is in-the-money (ITM) when the stock is above the strike; a put is ITM when the stock is below the strike. At-the-money (ATM) means strike ≈ spot. Out-of-the-money (OTM) options have no exercise value today.",
      ]},
      { h: "Intrinsic + extrinsic", p: [
        "Premium = intrinsic value + extrinsic (time) value. Intrinsic is what you'd get exercising right now: max(0, S−K) for calls, max(0, K−S) for puts.",
        "Extrinsic value is the price of possibility — it depends on time remaining and implied volatility, and it decays to zero by expiration.",
      ]},
    ],
    example: { title: "XYZ at $100, 90-strike call trading at $11.40", lines: [
      "Intrinsic = 100 − 90 = $10.00.",
      "Extrinsic = 11.40 − 10.00 = $1.40 — this part melts away by expiration.",
    ]},
    tryIt: ["Change the strike in the leg table to 90 then 110 and compare the 'Price' column.", "Push 'Days passed' toward expiry and notice the dashed curve losing its rounded shape."],
    takeaways: ["Only ITM options have intrinsic value.", "ATM options carry the most time value.", "Time value always reaches zero at expiration."],
    quiz: { q: "Stock is $50. A 55-strike put costs $6. How much is extrinsic value?", options: ["$6", "$5", "$1", "$0"], answer: 2, explain: "Intrinsic = 55 − 50 = $5, so extrinsic = 6 − 5 = $1." },
  },
  {
    id: "reading-payoff-diagrams",
    level: "Beginner",
    title: "Reading payoff diagrams",
    summary: "The hockey stick, breakevens, and the difference between 'today' and 'expiration'.",
    minutes: 7,
    lab: { title: "Short Put (cash-secured)", build: P("short-put") },
    sections: [
      { h: "Two curves", p: [
        "The solid line is P&L at expiration — piecewise straight lines bending at each strike. The dashed line is P&L today using Black-Scholes, which is smooth because time value remains.",
        "Green shading means profit at expiration, red means loss. Circles on the zero line mark breakevens.",
      ]},
      { h: "Short vs. long", p: [
        "A short option is the mirror image of the long: capped profit (the premium) and large potential loss. This lab shows a short put — you profit if the stock stays above the strike.",
      ]},
    ],
    example: { title: "Sell a 95 put for $1.20", lines: [
      "Credit received: $120.", "Breakeven: 95 − 1.20 = $93.80.", "Max loss: if stock goes to $0 → (95 − 1.20) × 100 = $9,380.",
    ]},
    tryIt: ["Hover the chart to read exact P&L at any price.", "Flip the leg from Sell to Buy and see the diagram reflect across the zero line."],
    takeaways: ["Strikes are the 'kinks' in the expiration line.", "Breakeven = where P&L crosses zero.", "Short options trade unlimited/large risk for high probability."],
    quiz: { q: "On a payoff diagram, where does the expiration line change slope?", options: ["At breakevens", "At each strike", "At the current spot price", "Nowhere — it's a straight line"], answer: 1, explain: "Option payoffs are piecewise linear with kinks exactly at the strike prices." },
  },
  {
    id: "covered-call-protective-put",
    level: "Beginner",
    title: "Stock + options: covered calls & protective puts",
    summary: "Generate income or buy insurance on shares you already own.",
    minutes: 10,
    lab: { title: "Covered Call", build: P("covered-call") },
    sections: [
      { h: "Covered call", p: [
        "Own 100 shares, sell 1 OTM call. You collect premium today in exchange for capping your upside at the strike. The risk profile is nearly identical to a short put at the same strike.",
      ]},
      { h: "Protective put", p: [
        "Own 100 shares, buy 1 put. The put acts as insurance: below the strike your losses stop. The cost is the premium, which drags on returns if nothing happens.",
        "Combine both and you get a collar — often near-zero cost, with both floor and ceiling.",
      ]},
    ],
    example: { title: "Covered call on 100 XYZ at $100", lines: [
      "Sell the 105 call for ~$1.50 → +$150 income.", "If XYZ ≤ 105 at expiration: keep shares + $150.", "If XYZ > 105: shares called away at 105 → max profit $500 + $150 = $650.",
    ]},
    tryIt: ["Change the call leg to a Buy Put at 95 to build a protective put.", "Add a third leg to create a collar."],
    takeaways: ["Covered call = income, capped upside.", "Protective put = insurance, defined downside.", "Covered call ≈ short put (put-call parity)."],
    quiz: { q: "A covered call's risk profile most closely resembles…", options: ["A long call", "A short put", "A long straddle", "A long put"], answer: 1, explain: "Long stock + short call is synthetically equivalent to a short put at the same strike." },
  },
  // ───────────── INTERMEDIATE ─────────────
  {
    id: "greeks-delta-gamma",
    level: "Intermediate",
    title: "The Greeks I: Delta & Gamma",
    summary: "Directional exposure and how it accelerates.",
    minutes: 12,
    lab: { title: "Long Call — Delta view", build: P("long-call"), metric: "delta" },
    sections: [
      { h: "Delta (Δ)", p: [
        "Delta is how much the option price changes for a $1 move in the underlying. Calls range 0 → 1, puts 0 → −1 (per share). The lab shows position delta in dollars per $1 move (already × 100).",
        "Delta is also a rough proxy for the probability of finishing ITM: a 0.30-delta call has about a 30% chance.",
      ]},
      { h: "Gamma (Γ)", p: [
        "Gamma is the rate of change of delta. It is highest for ATM options close to expiration. Long options are long gamma (delta moves in your favor); short options are short gamma (delta moves against you).",
      ]},
    ],
    example: { title: "ATM call, delta 0.53, gamma 0.046", lines: [
      "Stock +$1 → option gains ≈ $0.53, and delta rises to ≈ 0.58.", "Stock +$2 → gain ≈ 0.53 + 0.58 ≈ $1.11 per share — convexity at work.",
    ]},
    tryIt: ["Switch the chart to Γ Gamma and slide 'Days passed' toward expiry — the peak grows taller and sharper.", "Go back to Δ and watch the S-curve steepen."],
    takeaways: ["Delta = directional exposure.", "Gamma = how fast delta changes.", "Gamma explodes for ATM options near expiry."],
    quiz: { q: "Where is gamma typically highest?", options: ["Deep ITM, long-dated", "Deep OTM, long-dated", "ATM, near expiration", "It is constant"], answer: 2, explain: "ATM options near expiry have the most sensitive delta, i.e. the highest gamma." },
  },
  {
    id: "greeks-theta-vega",
    level: "Intermediate",
    title: "The Greeks II: Theta & Vega",
    summary: "Time decay and volatility sensitivity — the hidden drivers of option P&L.",
    minutes: 12,
    lab: { title: "Long Straddle — Theta view", build: P("straddle"), metric: "theta" },
    sections: [
      { h: "Theta (Θ)", p: [
        "Theta is the dollars an option loses per day, all else equal. Long options have negative theta; short options collect positive theta. Decay is non-linear — it accelerates in the final weeks.",
      ]},
      { h: "Vega (ν)", p: [
        "Vega is the change in option price per 1-point change in implied volatility. Long options are long vega: they gain when IV rises. Longer-dated options have more vega.",
        "The gamma–theta trade-off is fundamental: you pay theta to own gamma, and you're paid theta to be short gamma.",
      ]},
    ],
    example: { title: "Long 100 straddle, 30 DTE", lines: [
      "Theta ≈ −$13/day for the pair; vega ≈ +$23 per vol point.", "If IV rises 5 points overnight with no price move: ≈ +$115.", "If nothing happens for 10 days: ≈ −$140+ from decay.",
    ]},
    tryIt: ["Set 'IV change' to +10 and look at the P&L stat.", "Switch to ν Vega to see vega peak at the strike."],
    takeaways: ["Theta: time is the enemy of option buyers.", "Vega: volatility changes can outweigh price moves.", "Long gamma ⇔ short theta."],
    quiz: { q: "A long straddle with +$25 vega. IV drops 4 points. Approx P&L from vega?", options: ["+$100", "−$100", "−$25", "$0"], answer: 1, explain: "Vega × change = 25 × (−4) = −$100." },
  },
  {
    id: "vertical-spreads",
    level: "Intermediate",
    title: "Vertical spreads",
    summary: "Debit and credit spreads: defined risk, defined reward.",
    minutes: 11,
    lab: { title: "Bull Call Spread", build: P("bull-call") },
    sections: [
      { h: "Debit spreads", p: [
        "Buy one option and sell a further-OTM option of the same type and expiry. A bull call spread buys the 100 call and sells the 110 call: cheaper than a naked call, with capped profit.",
        "Max profit = width − debit. Max loss = debit.",
      ]},
      { h: "Credit spreads", p: [
        "Sell the closer option, buy the further one for protection. A bull put spread sells the 95 put and buys the 90 put. Max profit = credit; max loss = width − credit.",
        "Spreads reduce vega and theta exposure compared to single legs, making them less sensitive to volatility.",
      ]},
    ],
    example: { title: "Bull call 100/110 for $3.50", lines: [
      "Cost $350. Max profit (10 − 3.50) × 100 = $650 above $110.", "Breakeven: 100 + 3.50 = $103.50.",
    ]},
    tryIt: ["Change the short strike from 110 to 105 — cheaper, but less max profit.", "Rebuild as a bull put credit spread using two puts."],
    takeaways: ["Width − premium defines the other side of the risk.", "Spreads trade upside for lower cost.", "Credit spreads profit from time decay."],
    quiz: { q: "A $5-wide credit spread is sold for $1.40. Max loss?", options: ["$140", "$360", "$500", "$640"], answer: 1, explain: "(Width − credit) × 100 = (5 − 1.40) × 100 = $360." },
  },
  {
    id: "straddles-strangles",
    level: "Intermediate",
    title: "Straddles & strangles",
    summary: "Trading the size of the move instead of its direction.",
    minutes: 10,
    lab: { title: "Long Strangle", build: P("strangle") },
    sections: [
      { h: "Long volatility", p: [
        "A long straddle buys an ATM call and put. A strangle uses OTM strikes — cheaper but needs a bigger move. Both profit from large moves in either direction or from rising IV.",
      ]},
      { h: "Earnings and IV crush", p: [
        "Before events IV inflates. After the announcement IV often collapses (IV crush), so a straddle can lose even if the stock moves — the move must exceed what was priced in.",
        "The expected move implied by an ATM straddle ≈ straddle price.",
      ]},
    ],
    example: { title: "Pre-earnings straddle", lines: [
      "Straddle costs $8 with IV at 60%. After earnings, IV drops to 30%.", "Stock moves $6 — less than the $8 priced in — the trade loses.",
    ]},
    tryIt: ["Set IV change to −20 and move the stock ±6% — is it still profitable?", "Flip both legs to Sell to see a short strangle's risk."],
    takeaways: ["Straddle price ≈ market's expected move.", "Long vol: positive gamma & vega, negative theta.", "IV crush is the main enemy around events."],
    quiz: { q: "Why might a long straddle lose money after a big earnings move?", options: ["Delta too high", "IV crush outweighs the move", "Gamma turns negative", "Strikes too close"], answer: 1, explain: "If the realized move is smaller than the implied move, the vega loss from IV collapse dominates." },
  },
  // ───────────── ADVANCED ─────────────
  {
    id: "iron-condors-butterflies",
    level: "Advanced",
    title: "Iron condors & butterflies",
    summary: "Range-bound strategies that harvest theta with defined risk.",
    minutes: 13,
    lab: { title: "Iron Condor", build: P("iron-condor") },
    sections: [
      { h: "Iron condor", p: [
        "Sell an OTM put spread and an OTM call spread. You collect a credit and keep it if the stock stays between the short strikes. Max loss = wing width − credit.",
        "Managing: many traders close at 50% of max profit or roll the tested side.",
      ]},
      { h: "Butterfly", p: [
        "Buy 1 lower, sell 2 middle, buy 1 upper. Cheap, with a sharp profit peak at the middle strike — a precise 'pin' bet. Its P&L before expiry is muted; most gains appear in the final days.",
      ]},
    ],
    example: { title: "IC 85/92/108/115 on XYZ $100", lines: [
      "Credit ≈ $1.40 → $140; wings 7 wide → max loss ≈ $560.", "Profit zone ≈ $90.60 – $109.40 at expiration.",
    ]},
    tryIt: ["Switch to Θ — the condor has positive theta across the range.", "Slide days passed: P&L in the middle only grows late."],
    takeaways: ["Short vol, defined risk.", "Positive theta, negative gamma.", "Butterflies = cheap, precise targets."],
    quiz: { q: "An iron condor is best suited for…", options: ["Large directional moves", "Rising volatility", "A range-bound underlying", "Earnings breakouts"], answer: 2, explain: "Condors profit when the stock stays between the short strikes and IV is stable or falling." },
  },
  {
    id: "calendars-diagonals",
    level: "Advanced",
    title: "Calendars & term structure",
    summary: "Trading time itself: short front month, long back month.",
    minutes: 12,
    lab: { title: "Call Calendar (30/60 DTE)", build: P("calendar"), metric: "vega" },
    sections: [
      { h: "Calendar spread", p: [
        "Sell a near-term option and buy a longer-dated one at the same strike. The front decays faster, so you profit if the stock sits near the strike at front expiry. The 'expiration' line in the chart is the front-month expiry — the back leg still has time value.",
      ]},
      { h: "Term structure", p: [
        "Calendars are long vega: rising back-month IV helps. They're hurt when front-month IV spikes relative to back (backwardation), common before events. Diagonals use different strikes to add directional bias.",
      ]},
    ],
    example: { title: "Sell 30d 100C, buy 60d 100C", lines: [
      "Debit ≈ $1.50. Best case: XYZ ≈ $100 at day 30, back call still worth ≈ $4.80.", "Profit ≈ $330 near the strike; losses on large moves either way.",
    ]},
    tryIt: ["Set IV change to +10 and watch the curve lift.", "Change the back leg strike to 105 to build a diagonal."],
    takeaways: ["Profits from differential theta.", "Net long vega.", "Sensitive to term-structure shifts."],
    quiz: { q: "A calendar spread is typically…", options: ["Short vega", "Long vega", "Vega neutral always", "Long gamma"], answer: 1, explain: "The longer-dated long leg has more vega than the short front leg, making the position net long vega." },
  },
  {
    id: "implied-volatility-pricing",
    level: "Advanced",
    title: "Implied volatility & Black-Scholes",
    summary: "What the model assumes, what IV really means, and skew.",
    minutes: 14,
    lab: { title: "ATM Call — Vega view", build: (S) => [leg("call", 1, Math.round(S), { dte: 90 })], metric: "vega" },
    sections: [
      { h: "The model", p: [
        "Black-Scholes prices a European option from five inputs: spot, strike, time, rate, and volatility. Four are observable; volatility is solved from market prices — that's implied volatility.",
        "IV is the market's forecast of annualized standard deviation. 30% IV on a $100 stock implies a one-standard-deviation move of ≈ $30 over a year, or ≈ 100 × 0.30 × √(30/365) ≈ $8.60 over 30 days.",
      ]},
      { h: "Skew and smile", p: [
        "In practice IV differs by strike: equity OTM puts trade richer (put skew) because of crash demand. This means real strategies are priced off different IVs per leg — edit the IV column to model skew.",
      ]},
    ],
    example: { title: "Expected 30-day move", lines: ["Spot 100, IV 30%: σ₃₀ ≈ 100 × 0.30 × √(30/365) ≈ $8.60.", "~68% chance of finishing between $91.40 and $108.60 (lognormal approx)."] },
    tryIt: ["Change DTE to 10 then 180 and compare vega.", "Bump IV in the leg table from 30 to 50 — see the price column."],
    takeaways: ["IV is an output of price, not an input you know.", "Vega grows with time to expiry.", "Skew means different IV per strike."],
    quiz: { q: "IV of 20% on a $200 stock implies roughly what 1σ annual move?", options: ["$20", "$40", "$4", "$200"], answer: 1, explain: "200 × 0.20 = $40." },
  },
  {
    id: "risk-management-sizing",
    level: "Advanced",
    title: "Risk management & position sizing",
    summary: "Max loss, assignment, and building a portfolio of trades.",
    minutes: 11,
    lab: { title: "Short Straddle (undefined risk)", build: P("short-straddle") },
    sections: [
      { h: "Size by max loss", p: [
        "Risk a fixed fraction (often 1–5%) of capital per trade, measured by max loss — not premium. For undefined-risk trades, use a stress move (e.g. a 2–3σ move) instead.",
      ]},
      { h: "Assignment & early exercise", p: [
        "American options can be exercised early. Short ITM calls are at risk before ex-dividend dates; deep ITM short puts can be assigned anytime. Have a plan for the shares.",
        "Always know your exit rules: profit target, stop loss, and time stop (e.g. close at 21 DTE).",
      ]},
    ],
    example: { title: "Account $50,000, 2% risk rule", lines: ["Max risk per trade = $1,000.", "Credit spread with $360 max loss → up to 2 contracts.", "Short straddle → size using a ±15% stress move from the scenario grid."] },
    tryIt: ["Move the stock ±20% on this short straddle and note the loss.", "Add long wings to convert it into an iron butterfly — compare max loss."],
    takeaways: ["Size by worst case, not by premium.", "Undefined risk needs stress testing.", "Plan exits before entering."],
    quiz: { q: "What should determine the number of contracts you trade?", options: ["Premium received", "Probability of profit", "Max loss vs. account risk budget", "Delta"], answer: 2, explain: "Size by the capital at risk relative to your per-trade risk limit." },
  },
  // ───────────── EXPERT ─────────────
  {
    id: "delta-hedging-gamma-scalping",
    level: "Expert",
    title: "Delta hedging & gamma scalping",
    summary: "How market makers neutralize direction and trade realized vs. implied vol.",
    minutes: 15,
    lab: { title: "Long call hedged with short stock", build: (S) => [leg("call", 1, Math.round(S), { qty: 2 }), leg("stock", -1, S, { qty: 107 })], metric: "delta" },
    sections: [
      { h: "Delta neutral", p: [
        "Long 2 ATM calls (~+107 delta) and short 107 shares gives near-zero delta. The position no longer cares about small moves — what's left is gamma, theta and vega.",
      ]},
      { h: "Gamma scalping", p: [
        "As the stock rises, delta becomes positive: sell shares. As it falls, delta becomes negative: buy shares. Each rebalance locks in a small profit. If realized volatility exceeds the implied volatility you paid, scalps beat theta decay.",
        "Short gamma traders do the reverse and profit when realized vol is below implied.",
      ]},
    ],
    example: { title: "Daily rebalancing", lines: ["Day theta: −$12. Stock oscillates ±$2 daily.", "Scalp P&L ≈ ½ × Γ × ΔS² × 100 ≈ ½ × 9.2 × 4 ≈ $18/day → net positive."] },
    tryIt: ["Δ view: delta is ~0 at spot, curve slopes up — that's long gamma.", "Switch to P&L: the 'today' curve is a smile — profit on moves either way."],
    takeaways: ["Hedged options = pure volatility bet.", "Long gamma profits if realized > implied.", "P&L ≈ ½ Γ ΔS² − Θ."],
    quiz: { q: "A delta-hedged long option position profits primarily when…", options: ["The stock trends up", "Realized vol exceeds implied vol", "IV falls", "Time passes"], answer: 1, explain: "Gamma scalping gains outpace theta when the stock moves more than the option price implied." },
  },
  {
    id: "synthetics-parity",
    level: "Expert",
    title: "Synthetics & put-call parity",
    summary: "Replicate any position from others and spot mispricings.",
    minutes: 12,
    lab: { title: "Synthetic long stock", build: (S) => [leg("call", 1, Math.round(S)), leg("put", -1, Math.round(S))] },
    sections: [
      { h: "Parity", p: [
        "C − P = S − K·e^(−rT). A long call plus a short put at the same strike and expiry behaves exactly like long stock (minus financing). This relationship ties the whole options chain together.",
      ]},
      { h: "Synthetic toolbox", p: [
        "Synthetic long stock = +C −P. Synthetic long call = +stock +P. Synthetic short put = +stock −C (covered call). Conversions and reversals exploit parity violations — rare for retail, but essential for understanding.",
      ]},
    ],
    example: { title: "Check parity", lines: ["S = 100, K = 100, r = 4%, T = 30d.", "C − P should ≈ 100 − 100·e^(−0.04×30/365) ≈ $0.33."] },
    tryIt: ["Δ view: delta is a flat 100 — identical to 100 shares.", "Add 'Sell 100 stock' to see a fully flat conversion."],
    takeaways: ["Every position has synthetic equivalents.", "Parity links calls, puts, stock and rates.", "Use synthetics to find the cheapest structure."],
    quiz: { q: "Long stock + long put is synthetically…", options: ["A long call", "A short call", "A short put", "A straddle"], answer: 0, explain: "Protective put = synthetic long call at the same strike." },
  },
  {
    id: "advanced-structures",
    level: "Expert",
    title: "Ratios, risk reversals & skew trading",
    summary: "Asymmetric structures that monetize skew and directional conviction.",
    minutes: 13,
    lab: { title: "1x2 Call Ratio", build: P("ratio") },
    sections: [
      { h: "Ratio spreads", p: [
        "Buy 1, sell 2 further OTM. Often done for a credit or tiny debit; profits up to the short strike but has naked upside risk beyond. Best when you expect a moderate rally and elevated OTM IV.",
      ]},
      { h: "Risk reversals & skew", p: [
        "Sell an OTM put and buy an OTM call. When put skew is steep, the put pays for the call — a cheap bullish bet. Its price is a direct gauge of skew sentiment.",
        "Advanced traders model each strike with its own IV; edit the IV column to see how skew changes structure costs.",
      ]},
    ],
    example: { title: "Ratio 100/108 on XYZ $100", lines: ["Buy 100C, sell 2× 108C for a small debit.", "Max profit at $108; beyond ~$116 losses grow unlimited."] },
    tryIt: ["Set the short calls' IV to 35 (skew) and compare net cost.", "Add a long 120 call to cap the risk (a 'broken-wing' structure)."],
    takeaways: ["Ratios = asymmetric, can have naked risk.", "Risk reversals trade skew.", "Per-strike IV matters in real pricing."],
    quiz: { q: "A 1x2 call ratio spread has what risk above the upper strike?", options: ["None", "Limited to the debit", "Unlimited", "Equal to the width"], answer: 2, explain: "Net short one call above the upper strike → unlimited upside risk." },
  },
  {
    id: "portfolio-greeks",
    level: "Expert",
    title: "Portfolio Greeks & building a playbook",
    summary: "Manage a book by its aggregate Greeks and choose structures by regime.",
    minutes: 12,
    lab: { title: "Custom book: condor + long call", build: (S) => [...P("iron-condor")(S), leg("call", 1, Math.round(S * 1.05), { dte: 60 })] },
    sections: [
      { h: "Aggregate exposures", p: [
        "Professionals manage beta-weighted delta, net gamma, net theta and net vega across all positions. The goal is to own the exposures you intend and hedge the rest.",
      ]},
      { h: "Regime playbook", p: [
        "High IV + range expectation → short premium (condors, strangles, credit spreads). Low IV + expected move → long premium (straddles, debit spreads, calendars). Directional conviction → verticals or risk reversals.",
        "Use the Sandbox to stress test the full book with the scenario grid before committing capital.",
      ]},
    ],
    example: { title: "Balancing a book", lines: ["Condor: Δ ≈ 0, Θ +, ν −.", "Add a 60-day OTM call: adds Δ +, ν + — offsets vega risk and tilts bullish."] },
    tryIt: ["Toggle each Greek view to see how the extra call reshapes the book.", "Open this in the Sandbox and use the scenario grid."],
    takeaways: ["Manage the portfolio, not single trades.", "Match structure to volatility regime.", "Stress test before trading."],
    quiz: { q: "IV is historically high and you expect a range. Which fits best?", options: ["Long straddle", "Iron condor", "Long calendar", "Long OTM calls"], answer: 1, explain: "High IV + range = sell premium with defined risk, e.g. an iron condor." },
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
