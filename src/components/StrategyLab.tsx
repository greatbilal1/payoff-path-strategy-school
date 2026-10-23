import { useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { PayoffChart, type Metric } from "./PayoffChart";
import {
  analyze,
  entryPrice,
  firstExpiry,
  fmt$,
  leg as mkLeg,
  netCost,
  positionGreeks,
  positionPnL,
  type Leg,
} from "@/lib/options";
import { cn } from "@/lib/utils";

const METRICS: { id: Metric; label: string }[] = [
  { id: "pnl", label: "P&L" },
  { id: "delta", label: "Δ Delta" },
  { id: "gamma", label: "Γ Gamma" },
  { id: "theta", label: "Θ Theta" },
  { id: "vega", label: "ν Vega" },
];

function Slider({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-primary" />
    </label>
  );
}

export function StrategyLab({
  initialLegs,
  initialSpot = 100,
  initialMetric = "pnl",
  compact = false,
  title,
}: {
  initialLegs: Leg[];
  initialSpot?: number;
  initialMetric?: Metric;
  compact?: boolean;
  title?: string;
}) {
  const [legs, setLegs] = useState<Leg[]>(initialLegs);
  const [entrySpot, setEntrySpot] = useState(initialSpot);
  const [move, setMove] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ivShift, setIvShift] = useState(0);
  const [metric, setMetric] = useState<Metric>(initialMetric);

  const exp = firstExpiry(legs);
  const spot = entrySpot * (1 + move / 100);
  const el = Math.min(elapsed, exp);
  const g = useMemo(() => positionGreeks(legs, spot, Math.min(el, exp - 0.01), ivShift), [legs, spot, el, exp, ivShift]);
  const pnl = positionPnL(legs, entrySpot, spot, Math.min(el, exp - 0.01), ivShift);
  const stats = useMemo(() => analyze(legs, entrySpot), [legs, entrySpot]);
  const cost = netCost(legs, entrySpot);

  const update = (id: string, p: Partial<Leg>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const reset = () => {
    setLegs(initialLegs);
    setEntrySpot(initialSpot);
    setMove(0);
    setElapsed(0);
    setIvShift(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {title && <div className="text-xs uppercase tracking-widest text-muted-foreground">Live lab</div>}
          <h3 className="font-display text-lg font-semibold">{title ?? "Strategy"}</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {METRICS.map((m) => (
            <button key={m.id} onClick={() => setMetric(m.id)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition", metric === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-2">
        <PayoffChart legs={legs} entrySpot={entrySpot} spot={spot} elapsed={el} ivShift={ivShift} metric={metric} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="P&L at scenario" value={fmt$(pnl)} tone={pnl >= 0 ? "profit" : "loss"} />
        <Stat label={cost >= 0 ? "Net debit" : "Net credit"} value={fmt$(Math.abs(cost))} />
        <Stat label="Max profit" value={fmt$(stats.maxProfit)} tone="profit" />
        <Stat label="Max loss" value={fmt$(stats.maxLoss)} tone="loss" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Delta Δ" value={g.delta.toFixed(1)} hint="$ per $1 move" />
        <Stat label="Gamma Γ" value={g.gamma.toFixed(2)} hint="Δ change per $1" />
        <Stat label="Theta Θ" value={g.theta.toFixed(2)} hint="$ per day" />
        <Stat label="Vega ν" value={g.vega.toFixed(2)} hint="$ per 1 vol pt" />
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <Slider label="Underlying move" value={move} min={-40} max={40} step={0.5} onChange={setMove} display={`${move > 0 ? "+" : ""}${move}% → ${spot.toFixed(2)}`} />
        <Slider label="Days passed" value={el} min={0} max={exp} step={1} onChange={setElapsed} display={`${el} / ${exp}d`} />
        <Slider label="IV change" value={ivShift * 100} min={-25} max={25} step={1} onChange={(v) => setIvShift(v / 100)} display={`${ivShift > 0 ? "+" : ""}${Math.round(ivShift * 100)} pts`} />
      </div>

      {stats.breakevens.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Breakeven{stats.breakevens.length > 1 ? "s" : ""} at expiration: <span className="font-mono text-foreground">{stats.breakevens.map((b) => b.toFixed(2)).join(" · ")}</span>
        </p>
      )}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-sm font-semibold">Legs</span>
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Entry price
              <input type="number" value={entrySpot} min={1} onChange={(e) => setEntrySpot(Math.max(1, +e.target.value || 1))} className="w-20 rounded border border-input bg-background px-2 py-1 font-mono text-xs text-foreground" />
            </label>
            <button onClick={() => setLegs((l) => [...l, mkLeg("call", 1, Math.round(entrySpot))])} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"><Plus className="h-3 w-3" />Leg</button>
            <button onClick={reset} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"><RotateCcw className="h-3 w-3" />Reset</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Side</th><th className="px-2 font-medium">Type</th><th className="px-2 font-medium">Qty</th>
                <th className="px-2 font-medium">Strike</th><th className="px-2 font-medium">DTE</th><th className="px-2 font-medium">IV %</th>
                <th className="px-2 font-medium">Price</th><th />
              </tr>
            </thead>
            <tbody>
              {legs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    <select value={l.side} onChange={(e) => update(l.id, { side: +e.target.value as 1 | -1 })} className={cn("rounded border border-input bg-background px-1 py-1 font-semibold", l.side === 1 ? "text-profit" : "text-loss")}>
                      <option value={1}>Buy</option><option value={-1}>Sell</option>
                    </select>
                  </td>
                  <td className="px-2">
                    <select value={l.type} onChange={(e) => update(l.id, { type: e.target.value as Leg["type"], qty: e.target.value === "stock" ? 100 : 1 })} className="rounded border border-input bg-background px-1 py-1">
                      <option value="call">Call</option><option value="put">Put</option><option value="stock">Stock</option>
                    </select>
                  </td>
                  <td className="px-2"><Num v={l.qty} on={(v) => update(l.id, { qty: Math.max(1, v) })} /></td>
                  <td className="px-2">{l.type === "stock" ? <span className="text-muted-foreground">—</span> : <Num v={l.strike} on={(v) => update(l.id, { strike: Math.max(1, v) })} />}</td>
                  <td className="px-2">{l.type === "stock" ? <span className="text-muted-foreground">—</span> : <Num v={l.dte} on={(v) => update(l.id, { dte: Math.max(1, v) })} />}</td>
                  <td className="px-2">{l.type === "stock" ? <span className="text-muted-foreground">—</span> : <Num v={Math.round(l.iv * 100)} on={(v) => update(l.id, { iv: Math.max(1, v) / 100 })} />}</td>
                  <td className="px-2 font-mono">{entryPrice(l, entrySpot).toFixed(2)}</td>
                  <td className="px-2 text-right">
                    <button aria-label="Remove leg" onClick={() => setLegs((ls) => ls.filter((x) => x.id !== l.id))} className="rounded p-1 text-muted-foreground hover:text-loss" disabled={legs.length === 1}><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!compact && <ScenarioGrid legs={legs} entrySpot={entrySpot} ivShift={ivShift} />}
    </div>
  );
}

function Num({ v, on }: { v: number; on: (v: number) => void }) {
  return <input type="number" value={v} onChange={(e) => on(+e.target.value || 0)} className="w-16 rounded border border-input bg-background px-1.5 py-1 font-mono" />;
}

function Stat({ label, value, tone, hint }: { label: string; value: string; tone?: "profit" | "loss"; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-base font-semibold", tone === "profit" && "text-profit", tone === "loss" && "text-loss")}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ScenarioGrid({ legs, entrySpot, ivShift }: { legs: Leg[]; entrySpot: number; ivShift: number }) {
  const exp = firstExpiry(legs);
  const days = [0, Math.round(exp * 0.25), Math.round(exp * 0.5), Math.round(exp * 0.75), exp];
  const moves = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  const all = moves.flatMap((m) => days.map((d) => positionPnL(legs, entrySpot, entrySpot * (1 + m / 100), Math.min(d, exp - 0.001), ivShift)));
  const maxAbs = Math.max(1, ...all.map(Math.abs));
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">Scenario calculator — P&L by price & time</div>
      <div className="overflow-x-auto p-2">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="px-2 py-1 text-left font-medium">Move \ Day</th>
              {days.map((d) => <th key={d} className="px-2 py-1 text-right font-medium">{d === exp ? `Exp (${d})` : `D${d}`}</th>)}
            </tr>
          </thead>
          <tbody>
            {moves.map((m, i) => (
              <tr key={m}>
                <td className="px-2 py-1 text-muted-foreground">{m > 0 ? "+" : ""}{m}% <span className="opacity-60">{(entrySpot * (1 + m / 100)).toFixed(0)}</span></td>
                {days.map((d, j) => {
                  const v = all[i * days.length + j]!;
                  return (
                    <td key={d} className="px-2 py-1 text-right" style={{ background: `color-mix(in oklab, var(${v >= 0 ? "--profit" : "--loss"}) ${Math.round((Math.abs(v) / maxAbs) * 35)}%, transparent)` }}>
                      {Math.round(v).toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
