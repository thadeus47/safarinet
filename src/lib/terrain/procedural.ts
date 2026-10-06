import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import type { LatLng } from "@/lib/content/types";

// A stylised Kenya heightfield built from the country's main landforms. It stands in
// for the DEM -> glTF pipeline (scripts/terrain, see docs/TECHNICAL-PLAN.md) until real
// Copernicus/SRTM data is baked. Swap this module, not the scene, when that lands.

export type Surface = "land" | "ocean" | "lake";

type Peak = { lat: number; lng: number; km: number; rLat: number; rLng: number };

const PEAKS: Peak[] = [
  { lat: -0.15, lng: 37.31, km: 3.4, rLat: 0.28, rLng: 0.28 }, // Mt Kenya
  { lat: -3.07, lng: 37.35, km: 4.1, rLat: 0.3, rLng: 0.32 }, // Kilimanjaro (Tanzania)
  { lat: 1.13, lng: 34.55, km: 2.6, rLat: 0.3, rLng: 0.3 }, // Mt Elgon
  { lat: -0.4, lng: 36.68, km: 1.6, rLat: 0.5, rLng: 0.18 }, // Aberdares
  { lat: -0.55, lng: 35.75, km: 1.1, rLat: 0.6, rLng: 0.3 }, // Mau escarpment
  { lat: 1.2, lng: 35.45, km: 1.3, rLat: 0.35, rLng: 0.2 }, // Cherangani
  { lat: -2.6, lng: 37.9, km: 0.9, rLat: 0.3, rLng: 0.12 }, // Chyulu Hills
  { lat: -3.4, lng: 38.35, km: 1.0, rLat: 0.18, rLng: 0.18 }, // Taita Hills
  { lat: 2.3, lng: 37.95, km: 0.9, rLat: 0.25, rLng: 0.25 }, // Marsabit
];

type Lake = { lat: number; lng: number; rLat: number; rLng: number; levelKm: number };

const LAKES: Lake[] = [
  { lat: 3.55, lng: 36.08, rLat: 1.05, rLng: 0.2, levelKm: 0.36 }, // Turkana
  { lat: -0.55, lng: 33.95, rLat: 0.5, rLng: 0.55, levelKm: 1.13 }, // Victoria
  { lat: -0.77, lng: 36.36, rLat: 0.07, rLng: 0.07, levelKm: 1.89 }, // Naivasha
  { lat: 0.6, lng: 36.06, rLat: 0.12, rLng: 0.05, levelKm: 0.97 }, // Baringo
];

/** Simplified Kenya border as [lng, lat], clockwise from Lake Victoria. */
export const KENYA_BORDER: [number, number][] = [
  [33.92, -1.0], [33.95, 0.1], [34.1, 1.1], [34.8, 1.9], [34.95, 3.5], [34.6, 4.6],
  [35.6, 4.95], [36.0, 4.45], [37.0, 4.4], [38.1, 3.6], [39.6, 3.45], [40.0, 3.95],
  [41.2, 3.95], [41.9, 3.95], [40.98, 2.8], [40.99, -0.85], [41.56, -1.68], [40.9, -2.3],
  [40.2, -2.9], [39.75, -4.1], [39.2, -4.68], [37.7, -3.6], [37.6, -3.0], [33.92, -1.0],
];

const noise = new SimplexNoise({ random: mulberry32(7) });

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Shoreline as [lat, lng], south to north. Kenyan stretch matches KENYA_BORDER. */
const COAST: [number, number][] = [
  [-6.0, 38.8], [-4.68, 39.2], [-4.1, 39.75], [-2.9, 40.2], [-2.3, 40.9], [-1.68, 41.56],
  [-1.0, 42.0], [0.5, 42.9], [6.0, 45.0],
];

/** Longitude of the Indian Ocean shoreline at a given latitude. */
function coastLng(lat: number): number {
  for (let i = 1; i < COAST.length; i++) {
    const [lat1, lng1] = COAST[i];
    if (lat <= lat1) {
      const [lat0, lng0] = COAST[i - 1];
      return lng0 + ((lat - lat0) / (lat1 - lat0)) * (lng1 - lng0);
    }
  }
  return COAST[COAST.length - 1][1];
}

function fbm(x: number, y: number): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    sum += amp * noise.noise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum;
}

export function isInsideKenya({ lat, lng }: LatLng): boolean {
  let inside = false;
  for (let i = 0, j = KENYA_BORDER.length - 1; i < KENYA_BORDER.length; j = i++) {
    const [xi, yi] = KENYA_BORDER[i];
    const [xj, yj] = KENYA_BORDER[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Elevation in km above sea level, and what the surface is. */
export function sample({ lat, lng }: LatLng): { km: number; surface: Surface } {
  const toCoast = coastLng(lat) - lng;
  if (toCoast < 0) {
    return { km: Math.max(-0.4, toCoast * 0.6), surface: "ocean" };
  }

  // Plateau rising from the coast to the central highlands, lower in the dry north.
  const inland = smoothstep(0, 3.2, toCoast);
  const northDrop = smoothstep(1.5, 4.5, lat) * 0.55;
  let km = 0.05 + inland * (1.45 - northDrop);

  for (const p of PEAKS) {
    const d2 = ((lat - p.lat) / p.rLat) ** 2 + ((lng - p.lng) / p.rLng) ** 2;
    km += p.km * Math.exp(-d2 * 1.6);
  }

  // The Rift Valley trough, wandering slightly as it runs north.
  const riftLng = 36.2 + Math.sin(lat * 1.3) * 0.15;
  const riftMask = smoothstep(-2.4, -1.6, lat) * (1 - smoothstep(4.2, 4.8, lat));
  km -= 0.45 * riftMask * Math.exp(-(((lng - riftLng) / 0.3) ** 2));

  km += fbm(lng * 1.4, lat * 1.4) * 0.12 * (0.4 + inland);

  for (const l of LAKES) {
    const d2 = ((lat - l.lat) / l.rLat) ** 2 + ((lng - l.lng) / l.rLng) ** 2;
    if (d2 < 1) return { km: Math.min(km, l.levelKm), surface: "lake" };
  }

  return { km: Math.max(0.02, km), surface: "land" };
}
