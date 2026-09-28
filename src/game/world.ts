export const ROUND_SECONDS = 60;

const COLORS = ["#E36B4A", "#F2B84B", "#3DBE8B", "#3AA0E8", "#F07CA8"] as const;
const MISS = "#C45C4A";

export type Phase = "ready" | "playing" | "paused" | "over";

export interface Item {
  alive: boolean;
  kind: "circle" | "square";
  x: number;
  y: number;
  size: number;
  vy: number;
  rot: number;
  vr: number;
  color: string;
  value: number;
  phase: number;
  freq: number;
  amp: number;
}

export interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface Floater {
  alive: boolean;
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}

export interface Cloud {
  nx: number;
  ny: number;
  s: number;
  v: number;
}

export interface Pebble {
  nx: number;
  s: number;
  color: string;
}

export interface Bucket {
  x: number;
  targetX: number;
  prevX: number;
  squash: number;
  tilt: number;
  w: number;
  h: number;
}

export interface World {
  w: number;
  h: number;
  phase: Phase;
  timeLeft: number;
  elapsed: number;
  clock: number;
  score: number;
  streak: number;
  bestStreak: number;
  caught: number;
  missed: number;
  spawnAcc: number;
  totalSpawned: number;
  lastShown: number;
  endedLatch: boolean;
  reduceMotion: boolean;
  trauma: number;
  shakeT: number;
  bucket: Bucket;
  items: Item[];
  particles: Particle[];
  floaters: Floater[];
  clouds: Cloud[];
  pebbles: Pebble[];
}

export interface StepInput {
  pointerActive: boolean;
  pointerX: number;
  moveX: number;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds - 1e-4));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function bucketTop(world: World): number {
  return world.h - 22 - world.bucket.h;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function deadItem(): Item {
  return {
    alive: false,
    kind: "circle",
    x: 0,
    y: 0,
    size: 28,
    vy: 0,
    rot: 0,
    vr: 0,
    color: COLORS[0],
    value: 1,
    phase: 0,
    freq: 1,
    amp: 0,
  };
}

function deadParticle(): Particle {
  return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: "#fff", size: 3 };
}

function deadFloater(): Floater {
  return { alive: false, x: 0, y: 0, text: "", life: 0, max: 1, color: "#fff" };
}

export function createWorld(w: number, h: number, reduceMotion: boolean): World {
  return {
    w,
    h,
    phase: "ready",
    timeLeft: ROUND_SECONDS,
    elapsed: 0,
    clock: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    caught: 0,
    missed: 0,
    spawnAcc: 0.35,
    totalSpawned: 0,
    lastShown: ROUND_SECONDS,
    endedLatch: false,
    reduceMotion,
    trauma: 0,
    shakeT: 0,
    bucket: {
      x: w / 2,
      targetX: w / 2,
      prevX: w / 2,
      squash: 1,
      tilt: 0,
      w: 100,
      h: 48,
    },
    items: Array.from({ length: 36 }, deadItem),
    particles: Array.from({ length: 72 }, deadParticle),
    floaters: Array.from({ length: 14 }, deadFloater),
    clouds: [
      { nx: 0.12, ny: 0.12, s: 1.05, v: 14 },
      { nx: 0.58, ny: 0.08, s: 1.35, v: 8 },
      { nx: 0.82, ny: 0.2, s: 0.82, v: 18 },
      { nx: 0.34, ny: 0.26, s: 0.68, v: 11 },
    ],
    pebbles: [
      { nx: 0.12, s: 4, color: "#E3BE86" },
      { nx: 0.28, s: 3, color: "#D7A86A" },
      { nx: 0.47, s: 5, color: "#E8C892" },
      { nx: 0.63, s: 3, color: "#D2A56C" },
      { nx: 0.78, s: 4, color: "#E3BE86" },
      { nx: 0.9, s: 2.5, color: "#C99658" },
    ],
  };
}

export function resizeWorld(world: World, w: number, h: number): void {
  if (w < 2 || h < 2) return;
  const prevW = world.w > 0 ? world.w : w;
  const prevH = world.h > 0 ? world.h : h;
  const sx = w / prevW;
  const sy = h / prevH;
  world.w = w;
  world.h = h;
  world.bucket.w = clamp(w * 0.28, 86, 128);
  world.bucket.h = world.bucket.w * 0.48;
  const half = world.bucket.w / 2;
  world.bucket.x = clamp(world.bucket.x * sx, half, w - half);
  world.bucket.targetX = clamp(world.bucket.targetX * sx, half, w - half);
  world.bucket.prevX = world.bucket.x;
  for (const item of world.items) {
    if (!item.alive) continue;
    item.x = clamp(item.x * sx, item.size / 2, w - item.size / 2);
    item.y *= sy;
  }
}

export function resetRound(world: World): void {
  world.timeLeft = ROUND_SECONDS;
  world.elapsed = 0;
  world.score = 0;
  world.streak = 0;
  world.bestStreak = 0;
  world.caught = 0;
  world.missed = 0;
  world.spawnAcc = 0.28;
  world.totalSpawned = 0;
  world.lastShown = ROUND_SECONDS;
  world.endedLatch = false;
  world.trauma = 0;
  world.bucket.squash = 1;
  world.bucket.tilt = 0;
  const half = world.bucket.w / 2;
  const mid = clamp(world.w / 2, half, Math.max(half, world.w - half));
  world.bucket.x = mid;
  world.bucket.targetX = mid;
  world.bucket.prevX = mid;
  for (const item of world.items) item.alive = false;
  for (const particle of world.particles) particle.alive = false;
  for (const floater of world.floaters) floater.alive = false;
}

function pace(elapsed: number) {
  const t = clamp(elapsed / ROUND_SECONDS, 0, 1);
  const eased = t * t;
  return {
    interval: 1.05 - eased * 0.66,
    speed: 150 + eased * 220,
    drift: 10 + eased * 36,
    pair: eased > 0.5 ? (eased - 0.5) * 0.85 : 0,
  };
}

function burst(world: World, x: number, y: number, color: string, count: number): void {
  let left = count;
  for (const particle of world.particles) {
    if (left <= 0) break;
    if (particle.alive) continue;
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 160;
    particle.alive = true;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed - 50;
    particle.life = 0.4 + Math.random() * 0.28;
    particle.max = particle.life;
    particle.color = color;
    particle.size = 3 + Math.random() * 4;
    left -= 1;
  }
}

function popup(world: World, x: number, y: number, text: string, color: string): void {
  const floater = world.floaters.find((entry) => !entry.alive);
  if (!floater) return;
  floater.alive = true;
  floater.x = x;
  floater.y = y;
  floater.text = text;
  floater.life = 0.75;
  floater.max = 0.75;
  floater.color = color;
}

function spawnItem(world: World, speed: number, drift: number, xOverride?: number): void {
  const slot = world.items.find((item) => !item.alive);
  if (!slot) return;
  const small = Math.random() < 0.24;
  const size = small ? 16 + Math.random() * 6 : 26 + Math.random() * 16;
  const margin = size * 0.5 + 4;
  slot.alive = true;
  slot.kind = Math.random() < 0.5 ? "circle" : "square";
  slot.size = size;
  slot.x =
    xOverride ??
    (margin + Math.random() * Math.max(8, world.w - margin * 2));
  slot.y = -size;
  slot.vy = speed * (small ? 1.22 : 1) * (0.92 + Math.random() * 0.16);
  slot.rot = Math.random() * Math.PI;
  slot.vr = (Math.random() * 2 - 1) * (slot.kind === "square" ? 1.5 : 0.35);
  slot.color = COLORS[Math.floor(Math.random() * COLORS.length)] ?? COLORS[0];
  slot.value = small ? 2 : 1;
  slot.phase = Math.random() * Math.PI * 2;
  slot.freq = 1.1 + Math.random() * 1.3;
  slot.amp = drift * (0.55 + Math.random() * 0.7);
  world.totalSpawned += 1;
}

function catchItem(world: World, item: Item): void {
  item.alive = false;
  world.streak += 1;
  world.bestStreak = Math.max(world.bestStreak, world.streak);
  world.score += item.value;
  world.caught += 1;
  world.bucket.squash = 0.74;
  if (!world.reduceMotion) world.trauma = Math.min(1, world.trauma + 0.32);
  burst(world, item.x, bucketTop(world) + 8, item.color, 12);
  popup(world, item.x, bucketTop(world) - 8, `+${item.value}`, item.color);
}

function missItem(world: World, item: Item): void {
  item.alive = false;
  world.streak = 0;
  const before = world.score;
  world.score = Math.max(0, world.score - 1);
  world.missed += 1;
  burst(world, item.x, world.h - 28, MISS, 7);
  popup(world, item.x, world.h - 46, before > 0 ? "−1" : "Miss", MISS);
}

function updateItems(world: World, dt: number): void {
  const top = bucketTop(world);
  const rim = top + 8;
  const half = world.bucket.w * 0.42;
  for (const item of world.items) {
    if (!item.alive) continue;
    const prevBottom = item.y + item.size * 0.42;
    item.phase += dt;
    item.x += Math.sin(item.phase * item.freq) * item.amp * dt;
    item.x = clamp(item.x, item.size * 0.5, world.w - item.size * 0.5);
    item.y += item.vy * dt;
    item.rot += item.vr * dt;
    const bottom = item.y + item.size * 0.42;
    const inMouth = Math.abs(item.x - world.bucket.x) < half;
    const crossed = prevBottom < rim + 6 && bottom >= rim - 2;
    const overlapping = bottom >= rim - 2 && item.y < top + world.bucket.h * 0.72 && inMouth;
    if (inMouth && (crossed || overlapping)) {
      catchItem(world, item);
      continue;
    }
    if (item.y - item.size * 0.5 > world.h) missItem(world, item);
  }
}

function updateBucket(world: World, dt: number, input: StepInput): void {
  const half = world.bucket.w / 2;
  const maxX = Math.max(half, world.w - half);
  if (world.phase === "playing") {
    if (input.pointerActive) {
      world.bucket.targetX = clamp(input.pointerX, half, maxX);
    } else if (input.moveX !== 0) {
      world.bucket.x += input.moveX * 680 * dt;
      world.bucket.targetX = world.bucket.x;
    }
    if (input.pointerActive || input.moveX === 0) {
      const k = 1 - Math.exp(-18 * dt);
      world.bucket.x += (world.bucket.targetX - world.bucket.x) * k;
    }
  }
  world.bucket.x = clamp(world.bucket.x, half, maxX);
  world.bucket.targetX = clamp(world.bucket.targetX, half, maxX);
  const instant = dt > 0 ? (world.bucket.x - world.bucket.prevX) / dt : 0;
  const targetTilt = world.reduceMotion ? 0 : clamp(instant / 980, -0.16, 0.16);
  world.bucket.tilt += (targetTilt - world.bucket.tilt) * (1 - Math.exp(-12 * dt));
  world.bucket.prevX = world.bucket.x;
  world.bucket.squash += (1 - world.bucket.squash) * (1 - Math.exp(-10 * dt));
}

export function step(world: World, dt: number, input: StepInput): void {
  const stepDt = Math.min(dt, 0.05);
  world.clock += stepDt;
  world.trauma = Math.max(0, world.trauma - stepDt * 1.7);
  world.shakeT += stepDt;

  for (const cloud of world.clouds) {
    cloud.nx += (cloud.v * stepDt) / Math.max(world.w, 1);
    if (cloud.nx > 1.3) cloud.nx = -0.3;
  }

  for (const particle of world.particles) {
    if (!particle.alive) continue;
    particle.life -= stepDt;
    particle.vy += 520 * stepDt;
    particle.x += particle.vx * stepDt;
    particle.y += particle.vy * stepDt;
    if (particle.life <= 0) particle.alive = false;
  }

  for (const floater of world.floaters) {
    if (!floater.alive) continue;
    floater.life -= stepDt;
    floater.y -= 40 * stepDt;
    if (floater.life <= 0) floater.alive = false;
  }

  updateBucket(world, stepDt, input);

  if (world.phase !== "playing") return;

  world.elapsed += stepDt;
  world.timeLeft = Math.max(0, world.timeLeft - stepDt);
  const shown = Math.max(0, Math.ceil(world.timeLeft - 1e-4));
  if (shown !== world.lastShown) world.lastShown = shown;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.lastShown = 0;
    world.endedLatch = true;
    return;
  }

  const rate = pace(world.elapsed);
  world.spawnAcc += stepDt;
  let spawned = 0;
  while (world.spawnAcc >= rate.interval && spawned < 3) {
    world.spawnAcc -= rate.interval;
    spawned += 1;
    const first = world.totalSpawned === 0;
    spawnItem(world, rate.speed, rate.drift, first ? world.w / 2 : undefined);
    if (!first && Math.random() < rate.pair) spawnItem(world, rate.speed, rate.drift);
  }

  updateItems(world, stepDt);
}
