"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MapRegion } from "@/components/map/types";
import { toScene } from "@/lib/geo";
import { heightAt } from "./Terrain";

const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 8);
const OVERVIEW_RADIUS = 92;
const OVERVIEW_HEIGHT = 112;
const DRIFT_SECONDS = 90;

/**
 * Owns the camera. With no region selected it drifts slowly around Kenya; selecting a
 * region flies in with one GSAP timeline that moves the position and look-at target together.
 */
export function CameraRig({ selected }: { selected: MapRegion | null }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const target = useRef(OVERVIEW_TARGET.clone());
  const drift = useRef({ angle: -Math.PI / 2.4 });

  useEffect(() => {
    const update = () => {
      camera.lookAt(target.current);
      invalidate();
    };
    const tl = gsap.timeline({ onUpdate: update });

    if (selected) {
      const { x, z } = toScene(selected.center);
      const y = heightAt(x, z);
      const lookAt = new THREE.Vector3(x, y, z);
      // Come in from the south-east, so the region sits against higher ground behind it.
      const eye = new THREE.Vector3(x + 6, y + 11, z + 14);
      tl.to(camera.position, { x: eye.x, y: eye.y, z: eye.z, duration: 2.4, ease: "power3.inOut" }, 0);
      tl.to(target.current, { x: lookAt.x, y: lookAt.y, z: lookAt.z, duration: 2.4, ease: "power3.inOut" }, 0);
    } else {
      const placeOnOrbit = () => {
        const a = drift.current.angle;
        camera.position.set(
          OVERVIEW_TARGET.x + Math.cos(a) * OVERVIEW_RADIUS * 0.35,
          OVERVIEW_HEIGHT,
          OVERVIEW_TARGET.z - Math.sin(a) * OVERVIEW_RADIUS,
        );
      };
      const start = drift.current.angle;
      const startPos = new THREE.Vector3(
        OVERVIEW_TARGET.x + Math.cos(start) * OVERVIEW_RADIUS * 0.35,
        OVERVIEW_HEIGHT,
        OVERVIEW_TARGET.z - Math.sin(start) * OVERVIEW_RADIUS,
      );
      tl.to(camera.position, { x: startPos.x, y: startPos.y, z: startPos.z, duration: 2, ease: "power3.inOut" }, 0);
      tl.to(target.current, { x: OVERVIEW_TARGET.x, y: OVERVIEW_TARGET.y, z: OVERVIEW_TARGET.z, duration: 2, ease: "power3.inOut" }, 0);
      // The slow drift: swing back and forth across the southern view.
      tl.to(drift.current, {
        angle: start + 0.5,
        duration: DRIFT_SECONDS / 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        onUpdate: placeOnOrbit,
      });
    }

    return () => {
      tl.kill();
    };
  }, [selected, camera, invalidate]);

  return null;
}
