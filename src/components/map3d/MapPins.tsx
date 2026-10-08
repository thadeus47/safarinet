"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { MapPin } from "@/components/map/types";
import { toScene } from "@/lib/geo";
import { heightAt } from "./Terrain";

// Map pins (regions and the experience places inside a region) are plain DOM buttons
// in one overlay above the canvas, so they are tappable and screen-reader friendly.
// PinProjector (inside the Canvas) moves them to their projected screen positions on
// every rendered frame.

export type PinRefs = RefObject<Record<string, HTMLButtonElement | null>>;

export function PinOverlay({ pins, pinRefs }: { pins: MapPin[]; pinRefs: PinRefs }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pins.map((pin) => (
        <button
          key={pin.key}
          ref={(el) => {
            pinRefs.current[pin.key] = el;
          }}
          type="button"
          onClick={pin.onSelect}
          aria-pressed={pin.selected}
          // Hidden until the projector places it, so pins never flash at the top-left.
          style={{ visibility: "hidden" }}
          className={`pin pointer-events-auto absolute top-0 left-0 pin-${pin.variant} ${pin.selected ? "pin-selected" : ""}`}
        >
          <span className="pin-dot" aria-hidden />
          <span className="pin-label">
            {pin.label}
            {pin.variant === "soon" && <span className="pin-soon-tag">Coming soon</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Writes a pin's screen position straight to the DOM, outside React's render cycle. */
function placePin(el: HTMLButtonElement, x: number, y: number, visible: boolean) {
  el.style.visibility = visible ? "visible" : "hidden";
  // Anchor the pin's dot (its left edge, vertically centred) on the point.
  if (visible) el.style.transform = `translate3d(${x - 12}px, ${y - 18}px, 0)`;
}

export function PinProjector({ pins, pinRefs }: { pins: MapPin[]; pinRefs: PinRefs }) {
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const anchors = useMemo(
    () =>
      pins.map((p) => {
        const { x, z } = toScene(p);
        return { key: p.key, position: new THREE.Vector3(x, heightAt(x, z) + 0.05, z) };
      }),
    [pins],
  );

  // Draw a frame whenever the set of pins changes, so new pins appear straight away.
  useEffect(() => invalidate(), [anchors, invalidate]);

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    for (const { key, position } of anchors) {
      const el = pinRefs.current[key];
      if (!el) continue;
      v.copy(position).project(camera);
      const onScreen = v.z <= 1 && Math.abs(v.x) <= 1.2 && Math.abs(v.y) <= 1.2;
      placePin(el, ((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height, onScreen);
    }
  });

  return null;
}
