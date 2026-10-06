"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SoundControl } from "@/components/audio/SoundControl";
import { OVERVIEW_SCENE } from "@/lib/audio/soundscapes";
import { detectMode, writeModeCookie } from "@/lib/device/detectMode";
import { RegionPanel } from "./RegionPanel";
import type { DestinationCard, MapMode, MapRegion } from "./types";

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
}: {
  regions: MapRegion[];
  cardsByRegion: Record<string, DestinationCard[]>;
}) {
  const [mode, setMode] = useState<MapMode | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

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

  const select = useCallback((slug: string) => setSelectedSlug(slug), []);

  const switchMode = () => {
    const next: MapMode = mode === "3d" ? "lite" : "3d";
    writeModeCookie(next);
    setMode(next);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-night">
      {mode === null && <MapLoading />}
      {mode === "3d" && <Scene regions={regions} selected={selected} onSelect={select} />}
      {mode === "lite" && <LiteMap regions={regions} selected={selected} onSelect={select} />}

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto rounded-2xl bg-night/70 px-4 py-3 backdrop-blur">
          <h1 className="font-display text-xl text-sand sm:text-2xl">Safarinet</h1>
          <p className="text-xs text-sand/70 sm:text-sm">Explore Kenya. Tap a region to fly in.</p>
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
          cards={cardsByRegion[selected.slug] ?? []}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
