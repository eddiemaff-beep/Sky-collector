import type { Run } from "@/game/save";

export function formatWhen(at: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

export function Rules() {
  return (
    <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
      <li>Tap or click where the basket should go.</li>
      <li>A catch scores a point. A miss costs one.</li>
      <li>Small shapes with a white ring are worth two.</li>
      <li>You have one minute, and the sky speeds up.</li>
    </ul>
  );
}

export function RunList({ runs, best }: { runs: Run[]; best: number }) {
  if (runs.length === 0) {
    return <p className="text-sm text-muted">No runs yet. Finish a minute, or reset a scored round, to log it.</p>;
  }
  let marked = false;
  return (
    <ol className="flex flex-col">
      {runs.map((run, index) => {
        const isBest = !marked && run.score === best && best > 0;
        if (isBest) marked = true;
        return (
          <li
            key={`${run.at}-${index}`}
            className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0"
          >
            <span className="tabular-nums text-base font-medium">{run.score}</span>
            <span className="text-sm text-muted">
              {isBest ? "Best · " : ""}
              {formatWhen(run.at)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function PrimaryButton({
  label,
  onClick,
  testId,
}: {
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="press mt-5 flex h-12 w-full items-center justify-center rounded-md bg-accent text-base font-medium text-accent-fg"
    >
      {label}
    </button>
  );
}

export function StartPanel({ best, onPlay }: { best: number; onPlay: () => void }) {
  return (
    <section className="overlay-panel w-full max-w-sm rounded-2xl bg-surface p-5">
      <p className="text-sm font-medium text-muted">One-minute run</p>
      <h2 className="mt-1 font-display text-3xl font-medium tracking-tight">Catch the sky.</h2>
      <div className="md:hidden">
        <Rules />
        <p className="mt-4 text-sm text-muted">
          Keyboard: arrows or A and D.
        </p>
      </div>
      <p className="mt-3 hidden text-sm text-muted md:block">
        Tap, click, or hold an arrow. The basket slides to meet the drop.
      </p>
      <p className="mt-4 text-sm text-muted">
        Best{" "}
        <span className="font-medium text-fg tabular-nums">{best}</span>
      </p>
      <PrimaryButton label="Play" onClick={onPlay} testId="play" />
    </section>
  );
}

export function PausePanel({ onResume }: { onResume: () => void }) {
  return (
    <section className="overlay-panel w-full max-w-sm rounded-2xl bg-surface p-5">
      <p className="text-sm font-medium text-muted">Hold</p>
      <h2 className="mt-1 font-display text-3xl font-medium tracking-tight">Paused</h2>
      <p className="mt-3 text-sm text-muted">The clock is stopped. Resume when you are set.</p>
      <PrimaryButton label="Resume" onClick={onResume} testId="resume" />
    </section>
  );
}

export function EndPanel({
  score,
  caught,
  missed,
  bestStreak,
  isNewBest,
  best,
  runs,
  onAgain,
}: {
  score: number;
  caught: number;
  missed: number;
  bestStreak: number;
  isNewBest: boolean;
  best: number;
  runs: Run[];
  onAgain: () => void;
}) {
  return (
    <section className="overlay-panel max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-surface p-5">
      <p className="text-sm font-medium text-muted">Time's up</p>
      <h2 className="mt-1 font-display text-3xl font-medium tracking-tight">
        {isNewBest ? "New best" : "Round complete"}
      </h2>
      <p className="mt-3 font-display text-5xl font-medium tabular-nums tracking-tight">{score}</p>
      <p className="mt-2 text-sm text-muted">
        Caught {caught} · Missed {missed} · Streak {bestStreak}
      </p>
      <p className={`mt-1 text-sm ${isNewBest ? "text-good" : "text-muted"}`}>
        {isNewBest ? "That lead is saved on this device." : `Best ${best}`}
      </p>
      <div className="mt-4 md:hidden">
        <p className="text-sm font-medium text-muted">Recent runs</p>
        <RunList runs={runs} best={best} />
      </div>
      <PrimaryButton label="Play again" onClick={onAgain} testId="again" />
    </section>
  );
}
