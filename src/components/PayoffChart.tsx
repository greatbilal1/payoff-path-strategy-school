import { useMemo, useState } from "react";
import { analyze, firstExpiry, positionGreeks, positionPnL, type Leg } from "@/lib/options";

export type Metric = "pnl" | "delta" | "gamma" | "theta" | "vega";

const W = 640;
const H = 340;
const PAD = { l: 58, r: 16, t: 16, b: 34 };

export function PayoffChart({
  legs,
  entrySpot,
  spot,
  elapsed,
  ivShift,
  metric,
}: {
  legs: Leg[];
  entrySpot: number;
  spot: number;
  elapsed: number;
  ivShift: number;
  metric: Metric;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const exp = firstExpiry(legs);
  const lo = entrySpot * 0.6;
  const hi = entrySpot * 1.4;
  const N = 160;

  const data = useMemo(() => {
    const xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N);
    const val = (S: number, t: number) =>
      metric === "pnl" ? positionPnL(legs, entrySpot, S, t, ivShift) : positionGreeks(legs, S, t, ivShift)[metric];
    return {
      xs,
      expiry: metric === "pnl" ? xs.map((S) => positionPnL(legs, entrySpot, S, exp, 0)) : null,
      now: xs.map((S) => val(S, Math.min(elapsed, exp - 0.01))),
    };
  }, [legs, entrySpot, elapsed, ivShift, metric, exp, lo, hi]);

  const all = [...data.now, ...(data.expiry ?? [])];
  let yMin = Math.min(0, ...all);
  let yMax = Math.max(0, ...all);
  if (yMax - yMin < 1e-6) {
    yMax += 1;
    yMin -= 1;
  }
  const padY = (yMax - yMin) * 0.08;
  yMin -= padY;
  yMax += padY;

  const x = (S: number) => PAD.l + ((S - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(data.xs[i]).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const y0 = y(0);

  const fmtY = (v: number) =>
    metric === "pnl" || Math.abs(v) >= 100 ? `${Math.round(v).toLocaleString()}` : v.toFixed(Math.abs(v) < 1 ? 3 : 1);

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const be = metric === "pnl" ? analyze(legs, entrySpot).breakevens.filter((b) => b > lo && b < hi) : [];
  const strikes = [...new Set(legs.filter((l) => l.type !== "stock").map((l) => l.strike))];

  const area = data.expiry ? `${path(data.expiry)}L${x(hi)},${y0}L${x(lo)},${y0}Z` : "";

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * N);
          setHover(i >= 0 && i <= N ? i : null);
        }}
      >
        <defs>
          <clipPath id="above"><rect x="0" y="0" width={W} height={Math.max(0, y0)} /></clipPath>
          <clipPath id="below"><rect x="0" y={y0} width={W} height={Math.max(0, H - y0)} /></clipPath>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted-foreground)" className="font-mono">{fmtY(t)}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={x(t)} y={H - 12} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)" className="font-mono">{t.toFixed(0)}</text>
        ))}
        {strikes.map((k) => k > lo && k < hi && (
          <g key={k}>
            <line x1={x(k)} x2={x(k)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted-foreground)" strokeOpacity="0.25" />
            <text x={x(k)} y={PAD.t + 10} textAnchor="middle" fontSize="9" fill="var(--muted-foreground)" className="font-mono">K{k}</text>
          </g>
        ))}
        {area && (
          <>
            <path d={area} fill="var(--profit)" fillOpacity="0.14" clipPath="url(#above)" />
            <path d={area} fill="var(--loss)" fillOpacity="0.14" clipPath="url(#below)" />
          </>
        )}
        <line x1={PAD.l} x2={W - PAD.r} y1={y0} y2={y0} stroke="var(--foreground)" strokeOpacity="0.4" />
        {data.expiry && <path d={path(data.expiry)} fill="none" stroke="var(--foreground)" strokeWidth="2" />}
        <path d={path(data.now)} fill="none" stroke="var(--primary)" strokeWidth="2.25" strokeDasharray={metric === "pnl" ? "6 4" : undefined} />
        {be.map((b) => (
          <g key={b}>
            <circle cx={x(b)} cy={y0} r="4" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.5" />
            <text x={x(b)} y={y0 + 16} textAnchor="middle" fontSize="9" fill="var(--foreground)" className="font-mono">BE {b.toFixed(1)}</text>
          </g>
        ))}
        {spot > lo && spot < hi && (
          <line x1={x(spot)} x2={x(spot)} y1={PAD.t} y2={H - PAD.b} stroke="var(--primary)" strokeWidth="1.5" />
        )}
        {hover !== null && (
          <g>
            <line x1={x(data.xs[hover])} x2={x(data.xs[hover])} y1={PAD.t} y2={H - PAD.b} stroke="var(--foreground)" strokeOpacity="0.5" strokeDasharray="3 3" />
            <circle cx={x(data.xs[hover])} cy={y(data.now[hover])} r="3.5" fill="var(--primary)" />
            {data.expiry && <circle cx={x(data.xs[hover])} cy={y(data.expiry[hover])} r="3.5" fill="var(--foreground)" />}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-md border border-border bg-popover/95 px-3 py-2 font-mono text-xs shadow-sm">
          <div className="text-muted-foreground">Price {data.xs[hover].toFixed(2)}</div>
          <div className="text-primary">Now {fmtY(data.now[hover])}</div>
          {data.expiry && <div>Expiry {fmtY(data.expiry[hover])}</div>}
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-4 px-2 text-xs text-muted-foreground">
        {metric === "pnl" && <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-foreground" />At expiration (day {exp})</span>}
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-primary" />{metric === "pnl" ? `Today (day ${elapsed})` : `${metric} on day ${elapsed}`}</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-primary" />Spot {spot.toFixed(2)}</span>
      </div>
    </div>
  );
}
