/**
 * Backend bases. If VITE_* is set to a non-empty value, that wins (e.g. Render).
 * Otherwise use same-origin paths proxied by nginx (Docker / Contabo).
 * Development uses Vite proxy → local FastAPI ports.
 *
 * Runtime remap: old builds baked http://SAME_HOST:11002 etc. Those hit CORS from :11000.
 * We rewrite same-host + backend Docker ports → /api/* so even stale bundles recover after one deploy.
 */
function stripTrailingSlash(s: string) {
  return s.replace(/\/$/, "");
}

/** Treat "", whitespace, and literal "undefined" as unset (bad .env / Docker merges). */
function envApiUrl(name: "VITE_EXERCISE_API_URL" | "VITE_WORKOUT_API_URL" | "VITE_ASSISTANT_API_URL"): string | undefined {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s || s === "undefined") return undefined;
  return stripTrailingSlash(s);
}

/** Map http(s)://<same host>:1100x → same-origin /api/* (avoids cross-port CORS on Contabo). */
function remapDirectDockerPortsToRelative(base: string): string {
  if (typeof window === "undefined") return base;
  if (!/^https?:\/\//i.test(base)) return base;
  try {
    const u = new URL(base);
    const host = window.location.hostname;
    if (u.hostname !== host) return base;
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    if (port === "11002") return "/api/workout";
    if (port === "11001") return "/api/assistant";
    if (port === "11003") return "/api/exercises";
  } catch {
    /* ignore */
  }
  return base;
}

function resolveBase(envName: "VITE_EXERCISE_API_URL" | "VITE_WORKOUT_API_URL" | "VITE_ASSISTANT_API_URL", devRelative: string): string {
  const fromEnv = envApiUrl(envName);
  const fallback = devRelative;
  const raw = fromEnv ?? fallback;
  return remapDirectDockerPortsToRelative(raw);
}

export function getExerciseApiBase(): string {
  return resolveBase("VITE_EXERCISE_API_URL", "/api/exercises");
}

export function getWorkoutApiBase(): string {
  return resolveBase("VITE_WORKOUT_API_URL", "/api/workout");
}

export function getAssistantApiBase(): string {
  return resolveBase("VITE_ASSISTANT_API_URL", "/api/assistant");
}
