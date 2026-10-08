"use client";

import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MapFocus } from "@/components/map/types";
import { toScene } from "@/lib/geo";
import { heightAt } from "./Terrain";

type LatLng = { lat: number; lng: number };

const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 8);
const OVERVIEW_RADIUS = 92;
const OVERVIEW_HEIGHT = 112;
const DRIFT_SECONDS = 90;

/** Close-ups come in from the south-east, so places sit against higher ground behind them. */
const APPROACH = new THREE.Vector3(6, 11, 14).normalize();
const PLACE_DISTANCE = 4.5;

function groundPoint(at: LatLng): THREE.Vector3 {
  const { x, z } = toScene(at);
  return new THREE.Vector3(x, heightAt(x, z), z);
}

/** Look-at point and camera distance that fit every place in a region on screen. */
function regionShot(center: LatLng, places: LatLng[]) {
  const points = (places.length > 0 ? places : [center]).map(groundPoint);
  const centroid = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(points.length);
  centroid.y = heightAt(centroid.x, centroid.z);
  const radius = Math.max(...points.map((p) => Math.hypot(p.x - centroid.x, p.z - centroid.z)));
  const distance = THREE.MathUtils.clamp(radius * 3.2 + 2.5, 5.5, 22);
  return { lookAt: centroid, distance };
}

/**
 * Owns the camera. With no region selected it drifts slowly around Kenya. Selecting a
 * region flies in to fit its places; selecting a place closes in on it. Each move is
 * one GSAP timeline that tweens the position and the look-at target together.
 */
export function CameraRig({ focus }: { focus: MapFocus }) {
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
    const flyTo = (lookAt: THREE.Vector3, eye: THREE.Vector3, duration: number) => {
      tl.to(camera.position, { x: eye.x, y: eye.y, z: eye.z, duration, ease: "power3.inOut" }, 0);
      tl.to(target.current, { x: lookAt.x, y: lookAt.y, z: lookAt.z, duration, ease: "power3.inOut" }, 0);
    };

    if (focus.kind === "region") {
      const { lookAt, distance } = regionShot(focus.center, focus.places);
      flyTo(lookAt, lookAt.clone().addScaledVector(APPROACH, distance), 2.4);
    } else if (focus.kind === "place") {
      const lookAt = groundPoint(focus.at);
      flyTo(lookAt, lookAt.clone().addScaledVector(APPROACH, PLACE_DISTANCE), 1.4);
    } else {
      const orbit = (angle: number) =>
        new THREE.Vector3(
          OVERVIEW_TARGET.x + Math.cos(angle) * OVERVIEW_RADIUS * 0.35,
          OVERVIEW_HEIGHT,
          OVERVIEW_TARGET.z - Math.sin(angle) * OVERVIEW_RADIUS,
        );
      const start = drift.current.angle;
      flyTo(OVERVIEW_TARGET, orbit(start), 2);
      // The slow drift: swing back and forth across the southern view.
      tl.to(drift.current, {
        angle: start + 0.5,
        duration: DRIFT_SECONDS / 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        onUpdate: () => camera.position.copy(orbit(drift.current.angle)),
      });
    }

    return () => {
      tl.kill();
    };
  }, [focus, camera, invalidate]);

  return null;
}

/**
 * Shifts the rendered view so the camera's target sits in the part of the screen the
 * panel leaves visible: left of the side sheet on wide screens, above the bottom sheet
 * on phones. Pins follow automatically because they project through the same camera.
 */
export function FramingOffset({ panelOpen }: { panelOpen: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const wide = size.width >= 640;
    const goal = panelOpen
      ? wide
        ? { x: 208, y: 0 }
        : { x: 0, y: size.height * 0.31 }
      : { x: 0, y: 0 };
    const apply = () => {
      const { x, y } = offset.current;
      if (x === 0 && y === 0) camera.clearViewOffset();
      else camera.setViewOffset(size.width, size.height, x, y, size.width, size.height);
      invalidate();
    };
    const tween = gsap.to(offset.current, { ...goal, duration: 1.2, ease: "power3.inOut", onUpdate: apply, onComplete: apply });
    return () => {
      tween.kill();
    };
  }, [panelOpen, size.width, size.height, camera, invalidate]);

  return null;
}
