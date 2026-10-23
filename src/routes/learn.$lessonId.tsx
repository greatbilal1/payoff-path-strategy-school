import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FlaskConical, Lightbulb } from "lucide-react";
import { LESSONS, lessonById } from "@/lib/curriculum";
import { StrategyLab } from "@/components/StrategyLab";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/$lessonId")({
  loader: ({ params }) => {
    if (!lessonById(params.lessonId)) throw notFound();
    return { id: params.lessonId };
  },
  head: ({ loaderData }) => {
    const l = loaderData ? lessonById(loaderData.id) : undefined;
    const title = l ? `${l.title} — StrikeSchool options course` : "Lesson unavailable — StrikeSchool";
    const desc = l?.summary ?? "Options trading lesson.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(l ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = lessonById(lessonId)!;
  const idx = LESSONS.findIndex((l) => l.id === lessonId);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const { done, toggle } = useProgress();
  const isDone = done.includes(lesson.id);
  const legs = lesson.lab.build(100);

  return (
    <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Lesson pane */}
      <article className="border-border px-5 py-8 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-r lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <select
            value={lesson.id}
            onChange={(e) => (window.location.href = `/learn/${e.target.value}`)}
            className="max-w-[70%] rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            aria-label="Jump to lesson"
          >
            {LESSONS.map((l, i) => (
              <option key={l.id} value={l.id}>{i + 1}. {l.title} {done.includes(l.id) ? "✓" : ""}</option>
            ))}
          </select>
          <span className="font-mono text-xs text-muted-foreground">{idx + 1} / {LESSONS.length}</span>
        </div>

        <div className="mb-2 flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">{lesson.level}</span>
          <span className="text-muted-foreground">{lesson.minutes} min</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{lesson.summary}</p>

        <div className="mt-8 space-y-7">
          {lesson.sections.map((s) => (
            <section key={s.h}>
              <h2 className="mb-2 font-display text-xl font-semibold">{s.h}</h2>
              {s.p.map((p, i) => <p key={i} className="mb-3 leading-relaxed text-foreground/90">{p}</p>)}
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-5">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Worked example</div>
          <div className="mb-2 font-semibold">{lesson.example.title}</div>
          <ul className="space-y-1 font-mono text-sm">
            {lesson.example.lines.map((l) => <li key={l}>→ {l}</li>)}
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
          <div className="mb-2 flex items-center gap-2 font-semibold text-primary"><Lightbulb className="h-4 w-4" />Try it in the lab</div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {lesson.tryIt.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 font-display font-semibold">Key takeaways</h3>
          <ul className="space-y-1.5">
            {lesson.takeaways.map((t) => (
              <li key={t} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-profit" />{t}</li>
            ))}
          </ul>
        </div>

        <Quiz key={lesson.id} quiz={lesson.quiz} onCorrect={() => toggle(lesson.id)} />

        <div className="mt-10 flex items-center justify-between gap-2 border-t border-border pt-6">
          {prev ? (
            <Link to="/learn/$lessonId" params={{ lessonId: prev.id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{prev.title}</Link>
          ) : <span />}
          <button onClick={() => toggle(lesson.id, !isDone)} className={cn("rounded-md border px-3 py-1.5 text-sm", isDone ? "border-profit text-profit" : "border-border hover:bg-accent")}>
            {isDone ? "✓ Completed" : "Mark complete"}
          </button>
          {next ? (
            <Link to="/learn/$lessonId" params={{ lessonId: next.id }} onClick={() => toggle(lesson.id)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Next<ArrowRight className="h-4 w-4" /></Link>
          ) : (
            <Link to="/sandbox" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"><FlaskConical className="h-4 w-4" />Sandbox</Link>
          )}
        </div>
      </article>

      {/* Lab pane */}
      <aside className="bg-muted/20 px-5 py-8 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:px-8">
        <StrategyLab key={lesson.id} initialLegs={legs} initialMetric={lesson.lab.metric} title={lesson.lab.title} compact />
      </aside>
    </div>
  );
}

function Quiz({ quiz, onCorrect }: { quiz: { q: string; options: string[]; answer: number; explain: string }; onCorrect: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Check your understanding</div>
      <div className="mb-3 font-semibold">{quiz.q}</div>
      <div className="grid gap-2">
        {quiz.options.map((o, i) => {
          const state = pick === null ? "" : i === quiz.answer ? "correct" : i === pick ? "wrong" : "";
          return (
            <button
              key={o}
              disabled={pick !== null}
              onClick={() => { setPick(i); if (i === quiz.answer) onCorrect(); }}
              className={cn("rounded-lg border px-3 py-2 text-left text-sm transition", state === "correct" && "border-profit bg-profit/10", state === "wrong" && "border-loss bg-loss/10", !state && "border-border hover:bg-accent")}
            >{o}</button>
          );
        })}
      </div>
      {pick !== null && (
        <p className="mt-3 text-sm text-muted-foreground">
          <span className={pick === quiz.answer ? "text-profit" : "text-loss"}>{pick === quiz.answer ? "Correct. " : "Not quite. "}</span>
          {quiz.explain}
          {pick !== quiz.answer && <button onClick={() => setPick(null)} className="ml-2 underline">Retry</button>}
        </p>
      )}
    </div>
  );
}
