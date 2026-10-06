import type { LatLng } from "@/lib/content/types";

/** Kenya's bounding box, padded slightly. The 3D terrain covers exactly this. */
export const KENYA_BOUNDS = { west: 33.8, east: 42.0, south: -4.8, north: 5.1 };

/** World units across the terrain's east-west extent. */
export const TERRAIN_WIDTH = 100;

const lngSpan = KENYA_BOUNDS.east - KENYA_BOUNDS.west;
const latSpan = KENYA_BOUNDS.north - KENYA_BOUNDS.south;

export const TERRAIN_DEPTH = (TERRAIN_WIDTH * latSpan) / lngSpan;

/** Maps a lat/lng to scene x/z, with north toward -z. */
export function toScene({ lat, lng }: LatLng): { x: number; z: number } {
  const x = ((lng - KENYA_BOUNDS.west) / lngSpan - 0.5) * TERRAIN_WIDTH;
  const z = (0.5 - (lat - KENYA_BOUNDS.south) / latSpan) * TERRAIN_DEPTH;
  return { x, z };
}

/** Inverse of toScene. */
export function fromScene(x: number, z: number): LatLng {
  return {
    lng: KENYA_BOUNDS.west + (x / TERRAIN_WIDTH + 0.5) * lngSpan,
    lat: KENYA_BOUNDS.south + (0.5 - z / TERRAIN_DEPTH) * latSpan,
  };
}

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distances on cards are measured from Nairobi, where most visitors land. */
export const NAIROBI: LatLng = { lat: -1.2921, lng: 36.8219 };
