import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Sfx } from "@/game/audio";
import { drawWorld } from "@/game/draw";
import { loadSave, recordRun, writeSave, type SaveData } from "@/game/save";
import {
  createWorld,
  formatTime,
  resetRound,
  resizeWorld,
  step,
  type Phase,
  type World,
} from "@/game/world";
import { EndPanel, PausePanel, Rules, RunList, StartPanel } from "@/components/sky-collector/panels";

type Summary = { score: number; caught: number; missed: number; bestStreak: number };

const EMPTY_SUMMARY: Summary = { score: 0, caught: 0, missed: 0, bestStreak: 0 };

declare global {
  interface Window {
    __skyCollector?: {
      score: number;
      phase: string;
      timeLeft: number;
      bucketX: number;
      width: number;
    };
  }
}

function bump(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

const HudStats = memo(function HudStats({
  scoreRef,
  timeRef,
  bestRef,
  streakRef,
}: {
  scoreRef: RefObject<HTMLSpanElement | null>;
  timeRef: RefObject<HTMLSpanElement | null>;
  bestRef: RefObject<HTMLSpanElement | null>;
  streakRef: RefObject<HTMLParagraphElement | null>;
}) {
  return (
    <>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-md border border-border bg-surface px-2 py-1.5">
          <div className="text-xs font-medium text-muted">Score</div>
          <span
            ref={scoreRef}
            data-testid="score"
            className="stat-value block text-lg font-medium tabular-nums leading-tight"
          >
            0
          </span>
        </div>
        <div className="rounded-md border border-border bg-surface px-2 py-1.5">
          <div className="text-xs font-medium text-muted">Time</div>
          <span
            ref={timeRef}
            data-testid="time"
            className="stat-value block text-xl font-medium tabular-nums leading-tight"
          >
            1:00
          </span>
        </div>
        <div className="rounded-md border border-border bg-surface px-2 py-1.5">
          <div className="text-xs font-medium text-muted">Best</div>
          <span
            ref={bestRef}
            data-testid="best"
            className="stat-value block text-lg font-medium tabular-nums leading-tight"
          >
            0
          </span>
        </div>
      </div>
      <p
        ref={streakRef}
        data-testid="streak"
        className="mt-1 h-5 text-xs font-medium text-muted tabular-nums"
      />
    </>
  );
});

export function SkyCollector() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const streakRef = useRef<HTMLParagraphElement>(null);
  const worldRef = useRef<World | null>(null);
  const saveRef = useRef<SaveData>({ version: 1, best: 0, runs: [], muted: false });
  const phaseRef = useRef<Phase>("ready");
  const sfxRef = useRef<Sfx | null>(null);
  const pointerRef = useRef({ active: false, x: 0 });
  const keysRef = useRef(new Set<string>());

  const [phase, setPhase] = useState<Phase>("ready");
  const [save, setSave] = useState<SaveData>(saveRef.current);
  const [muted, setMuted] = useState(false);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [isNewBest, setIsNewBest] = useState(false);

  function sfx(): Sfx {
    if (!sfxRef.current) sfxRef.current = new Sfx();
    return sfxRef.current;
  }

  function syncPhase(next: Phase): void {
    phaseRef.current = next;
    const world = worldRef.current;
    if (world) world.phase = next;
    setPhase(next);
  }

  function paintHud(world: World): void {
    const scoreText = String(world.score);
    const timeText = formatTime(world.timeLeft);
    const bestText = String(saveRef.current.best);
    const streakText = world.streak >= 2 ? `Streak ${world.streak}` : "";
    if (scoreRef.current && scoreRef.current.textContent !== scoreText) {
      scoreRef.current.textContent = scoreText;
    }
    if (timeRef.current) {
      if (timeRef.current.textContent !== timeText) timeRef.current.textContent = timeText;
      const urgent = world.phase === "playing" && world.timeLeft <= 10 && world.timeLeft > 0;
      timeRef.current.dataset.urgent = urgent ? "true" : "false";
    }
    if (bestRef.current && bestRef.current.textContent !== bestText) {
      bestRef.current.textContent = bestText;
    }
    if (streakRef.current && streakRef.current.textContent !== streakText) {
      streakRef.current.textContent = streakText;
    }
  }

  function finish(world: World): void {
    syncPhase("over");
    setSummary({
      score: world.score,
      caught: world.caught,
      missed: world.missed,
      bestStreak: world.bestStreak,
    });
    const prevBest = saveRef.current.best;
    setIsNewBest(world.score > prevBest && world.score > 0);
    const next = recordRun(saveRef.current, world.score);
    saveRef.current = next;
    setSave(next);
    sfx().end();
    paintHud(world);
  }

  function restart(): void {
    const world = worldRef.current;
    if (!world) return;
    sfx().unlock();
    const abandon =
      (world.phase === "playing" || world.phase === "paused") &&
      world.score > 0 &&
      !world.endedLatch;
    if (abandon) {
      const next = recordRun(saveRef.current, world.score);
      saveRef.current = next;
      setSave(next);
    }
    resetRound(world);
    setIsNewBest(false);
    setSummary(EMPTY_SUMMARY);
    syncPhase("playing");
    paintHud(world);
    sfx().begin();
  }

  function togglePause(): void {
    const world = worldRef.current;
    if (!world) return;
    if (phaseRef.current === "playing") syncPhase("paused");
    else if (phaseRef.current === "paused") {
      sfx().unlock();
      syncPhase("playing");
    }
  }

  function toggleMute(): void {
    const next = !saveRef.current.muted;
    const updated = { ...saveRef.current, muted: next };
    saveRef.current = updated;
    setSave(updated);
    setMuted(next);
    sfx().setMuted(next);
    writeSave(updated);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loaded = loadSave();
    saveRef.current = loaded;
    setSave(loaded);
    setMuted(loaded.muted);
    sfx().setMuted(loaded.muted);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rect = canvas.getBoundingClientRect();
    const world = createWorld(Math.max(rect.width, 2), Math.max(rect.height, 2), reduce.matches);
    worldRef.current = world;
    paintHud(world);

    const onReduce = () => {
      if (worldRef.current) worldRef.current.reduceMotion = reduce.matches;
    };
    reduce.addEventListener("change", onReduce);

    const pointer = pointerRef.current;
    const localX = (clientX: number) => {
      const box = canvas.getBoundingClientRect();
      return clientX - box.left;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (phaseRef.current !== "playing") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      pointer.active = true;
      pointer.x = localX(event.clientX);
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail if the pointer already ended.
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.active) return;
      pointer.x = localX(event.clientX);
    };
    const endPointer = (event: PointerEvent) => {
      if (!pointer.active) return;
      pointer.x = localX(event.clientX);
      pointer.active = false;
      if (canvas.hasPointerCapture(event.pointerId)) {
        try {
          canvas.releasePointerCapture(event.pointerId);
        } catch {
          // Already released.
        }
      }
    };
    const onContextMenu = (event: Event) => event.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("contextmenu", onContextMenu);

    const GAME_KEYS = new Set(["ArrowLeft", "ArrowRight", "KeyA", "KeyD", "Space"]);
    const onKeyDown = (event: KeyboardEvent) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      keysRef.current.add(event.code);
      if (event.repeat) return;
      if (event.code === "Space" || event.code === "KeyP") {
        if (phaseRef.current === "playing" || phaseRef.current === "paused") togglePause();
        else if (phaseRef.current === "ready" || phaseRef.current === "over") restart();
        return;
      }
      if (event.code === "Enter" && (phaseRef.current === "ready" || phaseRef.current === "over")) {
        restart();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };
    const clearKeys = () => keysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);

    const onHide = () => {
      sfx().resume();
      if (document.hidden && phaseRef.current === "playing") syncPhase("paused");
    };
    document.addEventListener("visibilitychange", onHide);

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const fixed = 1 / 60;
    const loop = (now: number) => {
      const current = worldRef.current;
      if (!current) return;
      let delta = (now - last) / 1000;
      last = now;
      if (delta > 0.1) delta = 0.1;
      acc += delta;
      let guard = 0;
      const keys = keysRef.current;
      let moveX = 0;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) moveX -= 1;
      if (keys.has("ArrowRight") || keys.has("KeyD")) moveX += 1;
      while (acc >= fixed && guard < 5) {
        const caughtBefore = current.caught;
        const missedBefore = current.missed;
        const shownBefore = current.lastShown;
        const endedBefore = current.endedLatch;
        step(current, fixed, {
          pointerActive: pointer.active && phaseRef.current === "playing",
          pointerX: pointer.x,
          moveX,
        });
        if (current.caught > caughtBefore) {
          sfx().catch(current.streak);
          bump(scoreRef.current);
        }
        if (current.missed > missedBefore) {
          sfx().miss();
          bump(scoreRef.current);
        }
        if (
          current.lastShown !== shownBefore &&
          current.phase === "playing" &&
          current.lastShown > 0 &&
          current.lastShown <= 5
        ) {
          sfx().tick();
        }
        if (current.endedLatch && !endedBefore) finish(current);
        acc -= fixed;
        guard += 1;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW > 1 && cssH > 1) {
        const bw = Math.floor(cssW * dpr);
        const bh = Math.floor(cssH * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
          resizeWorld(current, cssW, cssH);
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawWorld(ctx, current);
        }
      }
      paintHud(current);
      window.__skyCollector = {
        score: current.score,
        phase: current.phase,
        timeLeft: current.timeLeft,
        bucketX: current.bucket.x,
        width: current.w,
      };
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      reduce.removeEventListener("change", onReduce);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", onHide);
      pointer.active = false;
    };
    // Mount once. Gameplay state lives in refs so the loop is not re-bound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pauseDisabled = phase === "ready" || phase === "over";
  const resetDisabled = phase === "ready";

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg text-fg">
      <aside className="hidden min-w-0 flex-1 flex-col justify-center overflow-y-auto px-8 py-8 md:flex">
        <p className="text-sm font-medium text-muted">One-minute run</p>
        <p className="mt-2 max-w-sm font-display text-4xl font-medium tracking-tight">
          A bright sky. A short clock.
        </p>
        <Rules />
        <p className="mt-6 max-w-sm text-sm text-subtle">
          Arrows or A and D slide the basket. A moves left, D moves right.
        </p>
      </aside>

      <main className="flex h-full w-full max-w-md shrink-0 flex-col border-border md:border-x">
        <header className="px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
          <h1 className="font-display text-xl font-medium tracking-tight">Sky Collector</h1>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="press inline-flex size-11 items-center justify-center rounded-md border border-border bg-surface text-fg"
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              aria-pressed={muted}
              onClick={toggleMute}
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <button
              type="button"
              className="press inline-flex size-11 items-center justify-center rounded-md border border-border bg-surface text-fg disabled:opacity-40"
              aria-label={phase === "paused" ? "Resume" : "Pause"}
              disabled={pauseDisabled}
              onClick={togglePause}
            >
              {phase === "paused" ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
            <button
              type="button"
              data-testid="reset"
              className="press inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-fg disabled:opacity-40"
              disabled={resetDisabled}
              onClick={restart}
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
          </div>
          <HudStats scoreRef={scoreRef} timeRef={timeRef} bestRef={bestRef} streakRef={streakRef} />
        </header>

        <div className="playfield-wrap relative min-h-0 flex-1">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            aria-label="Sky Collector playfield. Tap or click to move the basket."
          />
          {phase !== "playing" ? (
            <div className="scrim absolute inset-0 flex items-center justify-center p-4">
              {phase === "ready" ? <StartPanel best={save.best} onPlay={restart} /> : null}
              {phase === "paused" ? <PausePanel onResume={togglePause} /> : null}
              {phase === "over" ? (
                <EndPanel
                  score={summary.score}
                  caught={summary.caught}
                  missed={summary.missed}
                  bestStreak={summary.bestStreak}
                  isNewBest={isNewBest}
                  best={save.best}
                  runs={save.runs}
                  onAgain={restart}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </main>

      <aside className="hidden min-w-0 flex-1 flex-col overflow-y-auto px-8 py-8 md:flex">
        <p className="text-sm font-medium text-muted">High score</p>
        <p
          data-testid="best-side"
          className="mt-2 font-display text-5xl font-medium tabular-nums tracking-tight"
        >
          {save.best}
        </p>
        <p className="mt-8 text-sm font-medium text-muted">Recent runs</p>
        <div className="mt-2 max-w-sm">
          <RunList runs={save.runs} best={save.best} />
        </div>
      </aside>
    </div>
  );
}
