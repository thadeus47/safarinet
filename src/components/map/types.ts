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
  /** Experience slug; unique across regions. */
  id: string;
  href: string;
  bookHref: string;
  title: string;
  summary: string;
  typeLabel: string;
  location: { lat: number; lng: number };
  durationHours: number;
  rating?: { average: number; count: number };
  distanceKm: number;
  fromKes: number;
};

export type MapMode = "3d" | "lite";

type LatLng = { lat: number; lng: number };

export type PinVariant = "live" | "soon" | "place";

/** A tappable marker, drawn the same way by the 3D scene and the lite map. */
export type MapPin = {
  key: string;
  lat: number;
  lng: number;
  label: string;
  variant: PinVariant;
  selected: boolean;
  onSelect: () => void;
};

/** What the map should frame. */
export type MapFocus =
  | { kind: "overview" }
  | { kind: "region"; center: LatLng; places: LatLng[]; liteZoom: number }
  | { kind: "place"; at: LatLng };
