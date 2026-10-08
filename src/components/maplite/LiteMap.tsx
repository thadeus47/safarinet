"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { MapFocus, MapPin } from "@/components/map/types";
import { KENYA_BOUNDS } from "@/lib/geo";

const STYLE_URL = process.env.NEXT_PUBLIC_LITE_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

// Copied there by scripts/copy-maplibre-worker.mjs; the bundler doesn't emit it.
maplibregl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");

const KENYA: [[number, number], [number, number]] = [
  [KENYA_BOUNDS.west, KENYA_BOUNDS.south],
  [KENYA_BOUNDS.east, KENYA_BOUNDS.north],
];

const PLACE_ZOOM = 13;

/** Keeps the framed area clear of the panel: a side sheet on wide screens, a bottom sheet on phones. */
function panelPadding(panelOpen: boolean): maplibregl.PaddingOptions {
  // Pins hang their label to the right of the point, so leave room for it on that side.
  const edge = 48;
  const label = 180;
  if (!panelOpen) return { top: edge, bottom: edge, left: edge, right: edge + label };
  return window.matchMedia("(min-width: 640px)").matches
    ? { top: edge + 60, bottom: edge, left: edge, right: 420 + edge + label }
    : { top: 120, bottom: Math.round(window.innerHeight * 0.62) + 24, left: 24, right: 24 + label };
}

function renderPin(el: HTMLButtonElement, pin: MapPin) {
  el.className = `pin pin-${pin.variant} ${pin.selected ? "pin-selected" : ""}`;
  el.setAttribute("aria-pressed", String(pin.selected));
  // Rebuilt with DOM methods (not innerHTML) because labels come from the CMS.
  el.replaceChildren();
  const dot = document.createElement("span");
  dot.className = "pin-dot";
  dot.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "pin-label";
  label.textContent = pin.label;
  if (pin.variant === "soon") {
    const tag = document.createElement("span");
    tag.className = "pin-soon-tag";
    tag.textContent = "Coming soon";
    label.appendChild(tag);
  }
  el.append(dot, label);
}

/** Flat 2D map with the same pins as the 3D scene. No three.js is downloaded in this mode. */
export default function LiteMap({
  pins,
  focus,
  panelOpen,
}: {
  pins: MapPin[];
  focus: MapFocus;
  panelOpen: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>());
  const handlers = useRef(new Map<string, () => void>());

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
    const live = markers.current;
    return () => {
      live.forEach(({ marker }) => marker.remove());
      live.clear();
      instance.remove();
      map.current = null;
    };
  }, []);

  // Add, update and remove markers to match `pins`.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const live = markers.current;
    const wanted = new Set(pins.map((p) => p.key));
    for (const [key, { marker }] of live) {
      if (!wanted.has(key)) {
        marker.remove();
        live.delete(key);
      }
    }
    for (const pin of pins) {
      handlers.current.set(pin.key, pin.onSelect);
      let entry = live.get(pin.key);
      if (!entry) {
        // MapLibre owns the wrapper's classes and transform; the pin button lives inside it.
        const wrapper = document.createElement("div");
        const el = document.createElement("button");
        el.type = "button";
        el.addEventListener("click", () => handlers.current.get(pin.key)?.());
        wrapper.appendChild(el);
        // Anchor the pin's dot, not its middle, on the location (as the 3D map does).
        const marker = new maplibregl.Marker({ element: wrapper, anchor: "left", offset: [-12, 0] })
          .setLngLat([pin.lng, pin.lat])
          .addTo(instance);
        entry = { marker, el };
        live.set(pin.key, entry);
      }
      renderPin(entry.el, pin);
      // Keep the selected pin above its neighbours.
      entry.marker.getElement().style.zIndex = pin.selected ? "2" : pin.variant === "place" ? "1" : "0";
    }
  }, [pins]);

  // Frame the focus: all of Kenya, every place in a region, or one place.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const padding = panelPadding(panelOpen);
    if (focus.kind === "overview") {
      instance.fitBounds(KENYA, { padding, duration: 1600 });
    } else if (focus.kind === "region") {
      if (focus.places.length === 0) {
        instance.flyTo({ center: [focus.center.lng, focus.center.lat], zoom: focus.liteZoom, padding, speed: 1.4 });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        for (const p of focus.places) bounds.extend([p.lng, p.lat]);
        instance.fitBounds(bounds, { padding, maxZoom: 13, duration: 2000 });
      }
    } else {
      instance.flyTo({
        center: [focus.at.lng, focus.at.lat],
        zoom: Math.max(instance.getZoom(), PLACE_ZOOM),
        padding,
        speed: 1.2,
      });
    }
  }, [focus, panelOpen]);

  // MapLibre sets position: relative on its container, so the sizing lives on a wrapper.
  return (
    <div className="absolute inset-0">
      <div ref={container} className="h-full w-full" aria-label="Map of Kenya" role="region" />
    </div>
  );
}
