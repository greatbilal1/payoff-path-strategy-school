import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  const cls = "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground";
  const active = { className: "rounded-md px-3 py-1.5 text-sm bg-accent text-foreground" };
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary font-mono text-sm text-primary-foreground">Θ</span>
          Strike<span className="text-primary">School</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={cls} activeProps={active} activeOptions={{ exact: true }}>Curriculum</Link>
          <Link to="/learn/$lessonId" params={{ lessonId: "what-is-an-option" }} className={cls} activeProps={active}>Learn</Link>
          <Link to="/sandbox" className={cls} activeProps={active}>Sandbox</Link>
        </nav>
      </div>
    </header>
  );
}
