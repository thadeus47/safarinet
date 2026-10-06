"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { MapRegion } from "@/components/map/types";
import { toScene } from "@/lib/geo";
import { heightAt } from "./Terrain";

// Region pins are plain DOM buttons in one overlay above the canvas, so they are
// tappable and screen-reader friendly. PinProjector (inside the Canvas) moves them
// to their projected screen positions on every rendered frame.

export type PinRefs = RefObject<Record<string, HTMLButtonElement | null>>;

export function PinOverlay({
  regions,
  selected,
  onSelect,
  pinRefs,
}: {
  regions: MapRegion[];
  selected: MapRegion | null;
  onSelect: (slug: string) => void;
  pinRefs: PinRefs;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {regions.map((region) => {
        const live = region.status === "live";
        const isSelected = selected?.slug === region.slug;
        return (
          <button
            key={region.slug}
            ref={(el) => {
              pinRefs.current[region.slug] = el;
            }}
            type="button"
            onClick={() => onSelect(region.slug)}
            aria-pressed={isSelected}
            // Hidden until the projector places it, so pins never flash at the top-left.
            style={{ visibility: "hidden" }}
            className={`pin pointer-events-auto absolute top-0 left-0 ${live ? "pin-live" : "pin-soon"} ${isSelected ? "pin-selected" : ""}`}
          >
            <span className="pin-dot" aria-hidden />
            <span className="pin-label">
              {region.name}
              {!live && <span className="pin-soon-tag">Coming soon</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Writes a pin's screen position straight to the DOM, outside React's render cycle. */
function placePin(el: HTMLButtonElement, x: number, y: number, visible: boolean) {
  el.style.visibility = visible ? "visible" : "hidden";
  // Anchor the pin's dot (its left edge, vertically centred) on the point.
  if (visible) el.style.transform = `translate3d(${x - 12}px, ${y - 18}px, 0)`;
}

export function PinProjector({ regions, pinRefs }: { regions: MapRegion[]; pinRefs: PinRefs }) {
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const anchors = useMemo(
    () =>
      regions.map((r) => {
        const { x, z } = toScene(r.center);
        return { slug: r.slug, position: new THREE.Vector3(x, heightAt(x, z) + 0.3, z) };
      }),
    [regions],
  );

  // Draw one frame on mount so pins appear even before the camera moves.
  useEffect(() => invalidate(), [invalidate]);

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    for (const { slug, position } of anchors) {
      const el = pinRefs.current[slug];
      if (!el) continue;
      v.copy(position).project(camera);
      placePin(el, ((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height, v.z <= 1);
    }
  });

  return null;
}
