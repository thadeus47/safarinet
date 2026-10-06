import type { RegionStatus } from "@/lib/content/types";

// Serializable data passed from server pages into the client map.

export type MapRegion = {
  slug: string;
  name: string;
  tagline: string;
  status: RegionStatus;
  center: { lat: number; lng: number };
  liteZoom: number;
};

export type DestinationCard = {
  href: string;
  title: string;
  summary: string;
  typeLabel: string;
  distanceKm: number;
  fromKes: number;
};

export type MapMode = "3d" | "lite";
