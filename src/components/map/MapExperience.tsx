"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { SoundControl } from "@/components/audio/SoundControl";
import { OVERVIEW_SCENE } from "@/lib/audio/soundscapes";
import { detectMode, writeModeCookie } from "@/lib/device/detectMode";
import { RegionPanel } from "./RegionPanel";
import type { DestinationCard, MapFocus, MapMode, MapPin, MapRegion } from "./types";

// Each map is its own client-only chunk, so lite mode never downloads three.js.
const Scene = dynamic(() => import("@/components/map3d/Scene"), {
  ssr: false,
  loading: () => <MapLoading />,
});
const LiteMap = dynamic(() => import("@/components/maplite/LiteMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,#203326_0%,#0d1712_70%)]">
      <p className="text-sm tracking-wide text-sand/70">Loading Kenya…</p>
    </div>
  );
}

export function MapExperience({
  regions,
  cardsByRegion,
  account,
}: {
  regions: MapRegion[];
  cardsByRegion: Record<string, DestinationCard[]>;
  /** Who is signed in, with a sign-out button. Rendered under the title. */
  account?: ReactNode;
}) {
  const [mode, setMode] = useState<MapMode | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    detectMode().then((m) => {
      if (!cancelled) setMode(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => regions.find((r) => r.slug === selectedSlug) ?? null,
    [regions, selectedSlug],
  );

  const places = useMemo(() => (selected ? (cardsByRegion[selected.slug] ?? []) : []), [selected, cardsByRegion]);
  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  const selectRegion = useCallback((slug: string) => {
    setSelectedSlug(slug);
    setSelectedPlaceId(null);
  }, []);
  const closeRegion = useCallback(() => {
    setSelectedSlug(null);
    setSelectedPlaceId(null);
  }, []);

  // Escape steps back out: place → region → all of Kenya.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedPlaceId) setSelectedPlaceId(null);
      else if (selectedSlug) closeRegion();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPlaceId, selectedSlug, closeRegion]);

  const pins = useMemo((): MapPin[] => {
    const regionPins: MapPin[] = regions
      // Inside a region its places take over, so its own pin steps aside.
      .filter((r) => !(r.slug === selected?.slug && places.length > 0))
      .map((r) => ({
        key: `region:${r.slug}`,
        lat: r.center.lat,
        lng: r.center.lng,
        label: r.name,
        variant: r.status === "live" ? "live" : "soon",
        selected: r.slug === selected?.slug,
        onSelect: () => selectRegion(r.slug),
      }));
    const placePins: MapPin[] = places.map((p) => ({
      key: `place:${p.id}`,
      lat: p.location.lat,
      lng: p.location.lng,
      label: p.title,
      variant: "place",
      selected: p.id === selectedPlaceId,
      onSelect: () => setSelectedPlaceId(p.id),
    }));
    return [...regionPins, ...placePins];
  }, [regions, selected, places, selectedPlaceId, selectRegion]);

  const focus = useMemo((): MapFocus => {
    if (selectedPlace) return { kind: "place", at: selectedPlace.location };
    if (selected) {
      return { kind: "region", center: selected.center, places: places.map((p) => p.location), liteZoom: selected.liteZoom };
    }
    return { kind: "overview" };
  }, [selected, selectedPlace, places]);

  const switchMode = () => {
    const next: MapMode = mode === "3d" ? "lite" : "3d";
    writeModeCookie(next);
    setMode(next);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-night">
      {mode === null && <MapLoading />}
      {mode === "3d" && <Scene pins={pins} focus={focus} panelOpen={selected !== null} />}
      {mode === "lite" && <LiteMap pins={pins} focus={focus} panelOpen={selected !== null} />}

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto rounded-2xl bg-night/70 px-4 py-3 backdrop-blur">
          <h1 className="font-display text-xl text-sand sm:text-2xl">
            <Link href="/">Safarinet</Link>
          </h1>
          <p className="text-xs text-sand/70 sm:text-sm">Explore Kenya. Tap a region to fly in.</p>
          {account}
        </div>
        <div className="flex flex-col items-end gap-2">
          <SoundControl scene={selected?.slug ?? OVERVIEW_SCENE} />
          {mode && (
            <button
              type="button"
              onClick={switchMode}
              className="pointer-events-auto rounded-full bg-night/70 px-4 py-2 text-xs font-medium text-sand backdrop-blur hover:bg-night/90"
            >
              {mode === "3d" ? "Switch to lite map" : "Switch to 3D map"}
            </button>
          )}
        </div>
      </header>

      {selected && (
        <RegionPanel
          region={selected}
          cards={places}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlaceId}
          onClose={closeRegion}
        />
      )}
    </div>
  );
}
