import type { MapMode } from "@/components/map/types";

// Picks 3D or lite mode on first load (PRD LITE-1). A manual choice is kept in a
// cookie and always wins over detection.

export const MODE_COOKIE = "sn-mode";

type NetworkInformation = { effectiveType?: string; saveData?: boolean };

export function readModeCookie(): MapMode | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${MODE_COOKIE}=(3d|lite)`));
  return (match?.[1] as MapMode | undefined) ?? null;
}

export function writeModeCookie(mode: MapMode) {
  document.cookie = `${MODE_COOKIE}=${mode}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Cheap checks that don't touch the network. Returns null when they can't decide. */
function quickVerdict(): MapMode | null {
  if (!hasWebGL()) return "lite";
  const nav = navigator as Navigator & { connection?: NetworkInformation; deviceMemory?: number };
  const conn = nav.connection;
  if (conn?.saveData) return "lite";
  if (conn?.effectiveType && ["slow-2g", "2g", "3g"].includes(conn.effectiveType)) return "lite";
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return "lite";
  return null;
}

export async function detectMode(): Promise<MapMode> {
  const saved = readModeCookie();
  if (saved) return saved;
  const quick = quickVerdict();
  if (quick) return quick;
  try {
    const { getGPUTier } = await import("detect-gpu");
    const result = await Promise.race([
      getGPUTier(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    // Tier 0-1 GPUs can't hold 30 fps on the terrain; unknown means try 3D.
    if (result && result.tier < 2) return "lite";
  } catch {
    // Benchmark data unavailable: fall through to 3D.
  }
  return "3d";
}
