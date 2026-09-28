const KEY = "sky-collector.v1";
const BACKUP_KEY = "sky-collector.v1.bak";
export const SAVE_VERSION = 1;

export type Run = { score: number; at: number };

export type SaveData = {
  version: number;
  best: number;
  runs: Run[];
  muted: boolean;
};

function defaults(): SaveData {
  return { version: SAVE_VERSION, best: 0, runs: [], muted: false };
}

function sanitize(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<SaveData>;
  const runs = Array.isArray(value.runs)
    ? value.runs
        .filter(
          (run): run is Run =>
            !!run &&
            typeof run === "object" &&
            typeof run.score === "number" &&
            Number.isFinite(run.score) &&
            typeof run.at === "number",
        )
        .slice(0, 8)
    : [];
  const best = typeof value.best === "number" && Number.isFinite(value.best) ? value.best : 0;
  return {
    version: SAVE_VERSION,
    best: Math.max(0, Math.floor(best), ...runs.map((run) => Math.max(0, Math.floor(run.score)))),
    runs: runs.map((run) => ({ score: Math.max(0, Math.floor(run.score)), at: run.at })),
    muted: value.muted === true,
  };
}

function readKey(key: string): SaveData | null {
  try {
    const text = localStorage.getItem(key);
    if (!text) return null;
    return sanitize(JSON.parse(text));
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  return readKey(KEY) ?? readKey(BACKUP_KEY) ?? defaults();
}

export function writeSave(data: SaveData): void {
  const payload: SaveData = {
    version: SAVE_VERSION,
    best: Math.max(0, Math.floor(data.best)),
    runs: data.runs.slice(0, 8),
    muted: data.muted,
  };
  try {
    const prev = localStorage.getItem(KEY);
    if (prev) localStorage.setItem(BACKUP_KEY, prev);
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Private mode and quota failures stay in memory.
  }
}

export function recordRun(data: SaveData, score: number): SaveData {
  const clean = Math.max(0, Math.floor(score));
  const next: SaveData = {
    version: SAVE_VERSION,
    best: Math.max(data.best, clean),
    runs: [{ score: clean, at: Date.now() }, ...data.runs].slice(0, 8),
    muted: data.muted,
  };
  writeSave(next);
  return next;
}
