import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StrategyLab } from "@/components/StrategyLab";
import { PRESETS } from "@/lib/options";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sandbox")({
  head: () => ({
    meta: [
      { title: "Options Strategy Sandbox — StrikeSchool" },
      { name: "description", content: "Build custom multi-leg options strategies, view payoff diagrams and Greeks, and stress test price, time and volatility scenarios." },
      { property: "og:title", content: "Options Strategy Sandbox — StrikeSchool" },
      { property: "og:description", content: "Multi-leg options simulator with payoff charts, Greeks and a scenario grid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sandbox,
});

function Sandbox() {
  const [presetId, setPresetId] = useState("iron-condor");
  const [spot, setSpot] = useState(100);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Sandbox</h1>
          <p className="text-sm text-muted-foreground">Start from a template, then edit, add or remove legs freely.</p>
        </div>
        <label className="block text-xs text-muted-foreground">
          Template underlying price
          <input type="number" value={spot} min={1} onChange={(e) => setSpot(Math.max(1, +e.target.value || 1))} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm text-foreground" />
        </label>
        <div className="space-y-1">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPresetId(p.id)} className={cn("w-full rounded-lg border px-3 py-2 text-left transition", p.id === presetId ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent")}>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.outlook}</div>
            </button>
          ))}
        </div>
      </aside>
      <main>
        <StrategyLab key={`${presetId}-${spot}`} initialLegs={preset.build(spot)} initialSpot={spot} title={preset.name} />
      </main>
    </div>
  );
}
