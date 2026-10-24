import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, FlaskConical } from "lucide-react";
import { LESSONS, LEVELS } from "@/lib/curriculum";
import { useProgress } from "@/hooks/use-progress";
import { PayoffChart } from "@/components/PayoffChart";
import { presetById } from "@/lib/options";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StrikeSchool — Options Trading Course, Beginner to Expert" },
      { name: "description", content: "Learn options trading with guided lessons, live payoff diagrams, Greeks, scenario calculators and a multi-leg strategy sandbox." },
      { property: "og:title", content: "StrikeSchool — Options Trading Course" },
      { property: "og:description", content: "Guided lessons, interactive payoff charts, Greeks and a multi-leg options sandbox." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const heroLegs = presetById("iron-condor")!.build(100);

function Index() {
  const { done } = useProgress();
  const pct = Math.round((done.length / LESSONS.length) * 100);
  const next = LESSONS.find((l) => !done.includes(l.id)) ?? LESSONS[0]!;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24">
      <section className="grid items-center gap-10 py-14 lg:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
            {LESSONS.length} lessons · 4 levels · live Black-Scholes engine
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Learn options by <span className="text-primary">moving the curve.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            A full course from your first call to delta-hedged portfolios. Every lesson sits next to a live payoff diagram and Greeks you can push, bend and break.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/learn/$lessonId" params={{ lessonId: next.id }} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
              {done.length ? "Continue" : "Start the course"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/sandbox" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-medium hover:bg-accent">
              <FlaskConical className="h-4 w-4" /> Open sandbox
            </Link>
          </div>
          {done.length > 0 && (
            <div className="mt-6 max-w-sm">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Your progress</span><span className="font-mono">{pct}%</span></div>
              <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center justify-between px-2 font-mono text-xs text-muted-foreground"><span>IRON CONDOR · XYZ 100</span><span>30 DTE</span></div>
          <PayoffChart legs={heroLegs} entrySpot={100} spot={100} elapsed={10} ivShift={0} metric="pnl" />
        </div>
      </section>

      {LEVELS.map((lvl, li) => {
        const lessons = LESSONS.filter((l) => l.level === lvl);
        return (
          <section key={lvl} className="border-t border-border py-10">
            <div className="mb-6 flex items-baseline gap-4">
              <span className="font-mono text-sm text-primary">0{li + 1}</span>
              <h2 className="font-display text-2xl font-bold">{lvl}</h2>
              <span className="text-sm text-muted-foreground">{lessons.length} lessons</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {lessons.map((l) => {
                const isDone = done.includes(l.id);
                return (
                  <Link key={l.id} to="/learn/$lessonId" params={{ lessonId: l.id }} className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary">
                    {isDone ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-profit" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold group-hover:text-primary">{l.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{l.summary}</div>
                      <div className="mt-2 font-mono text-xs text-muted-foreground">{l.minutes} min · lab: {l.lab.title}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="border-t border-border pt-8 text-xs text-muted-foreground">Educational content only — not financial advice. Prices use a simplified Black-Scholes model: European exercise, no dividends, a configurable interest rate, and theoretical entry fills. Listed US equity options are generally American-style and can be exercised early.</p>
    </div>
  );
}
