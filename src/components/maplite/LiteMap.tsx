"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { MapRegion } from "@/components/map/types";
import { KENYA_BOUNDS } from "@/lib/geo";

const STYLE_URL = process.env.NEXT_PUBLIC_LITE_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

// Copied there by scripts/copy-maplibre-worker.mjs; the bundler doesn't emit it.
maplibregl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");

const KENYA: [[number, number], [number, number]] = [
  [KENYA_BOUNDS.west, KENYA_BOUNDS.south],
  [KENYA_BOUNDS.east, KENYA_BOUNDS.north],
];

/** Flat 2D map with the same pins as the 3D scene. No three.js is downloaded in this mode. */
export default function LiteMap({
  regions,
  selected,
  onSelect,
}: {
  regions: MapRegion[];
  selected: MapRegion | null;
  onSelect: (slug: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!container.current) return;
    const instance = new maplibregl.Map({
      container: container.current,
      style: STYLE_URL,
      bounds: KENYA,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    instance.touchZoomRotate.disableRotation();
    map.current = instance;

    const created: maplibregl.Marker[] = [];
    const markerEls = markers.current;
    for (const region of regions) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `pin ${region.status === "live" ? "pin-live" : "pin-soon"}`;
      el.innerHTML = `<span class="pin-dot" aria-hidden="true"></span><span class="pin-label"></span>`;
      const label = el.querySelector(".pin-label")!;
      label.textContent = region.name;
      if (region.status !== "live") {
        const tag = document.createElement("span");
        tag.className = "pin-soon-tag";
        tag.textContent = "Coming soon";
        label.appendChild(tag);
      }
      el.addEventListener("click", () => onSelectRef.current(region.slug));
      markerEls.set(region.slug, el);
      created.push(new maplibregl.Marker({ element: el }).setLngLat([region.center.lng, region.center.lat]).addTo(instance));
    }

    return () => {
      created.forEach((m) => m.remove());
      markerEls.clear();
      instance.remove();
      map.current = null;
    };
  }, [regions]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    markers.current.forEach((el, slug) => {
      el.classList.toggle("pin-selected", slug === selected?.slug);
      el.setAttribute("aria-pressed", String(slug === selected?.slug));
    });
    if (selected) {
      // Keep the region clear of the panel: a side sheet on wide screens, a bottom sheet on phones.
      const wide = window.matchMedia("(min-width: 640px)").matches;
      const padding = wide
        ? { top: 0, bottom: 0, left: 0, right: 420 }
        : { top: 80, bottom: Math.round(window.innerHeight * 0.62), left: 0, right: 0 };
      instance.flyTo({
        center: [selected.center.lng, selected.center.lat],
        zoom: selected.liteZoom,
        speed: 1.4,
        padding,
      });
    } else {
      instance.fitBounds(KENYA, { padding: 24 });
    }
  }, [selected]);

  // MapLibre sets position: relative on its container, so the sizing lives on a wrapper.
  return (
    <div className="absolute inset-0">
      <div ref={container} className="h-full w-full" aria-label="Map of Kenya" role="region" />
    </div>
  );
}
