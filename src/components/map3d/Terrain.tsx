"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fromScene, TERRAIN_DEPTH, TERRAIN_WIDTH, toScene } from "@/lib/geo";
import { isInsideKenya, KENYA_BORDER, sample } from "@/lib/terrain/procedural";

/** Scene units per km of elevation, exaggerated so the highlands read at country scale. */
export const VERTICAL_SCALE = 0.75;

const SEGMENTS_X = 240;

const palette = {
  ocean: new THREE.Color("#1f4e6b"),
  lake: new THREE.Color("#2f6f8f"),
  coast: new THREE.Color("#d8c38f"),
  savanna: new THREE.Color("#c9a464"),
  dry: new THREE.Color("#b98a52"),
  highland: new THREE.Color("#5f7f45"),
  forest: new THREE.Color("#3d5e34"),
  rock: new THREE.Color("#7b7064"),
  snow: new THREE.Color("#eef1f2"),
};

// Elevation colour stops in km. Colours blend between stops, so there are no hard bands.
const STOPS: [number, THREE.Color][] = [
  [0.0, palette.coast],
  [0.35, palette.savanna],
  [1.1, palette.savanna],
  [1.7, palette.highland],
  [2.6, palette.forest],
  [3.4, palette.rock],
  [4.2, palette.snow],
];

function landColor(km: number, lat: number, out: THREE.Color) {
  let i = 1;
  while (i < STOPS.length - 1 && km > STOPS[i][0]) i++;
  const [k0, c0] = STOPS[i - 1];
  const [k1, c1] = STOPS[i];
  const t = Math.min(1, Math.max(0, (km - k0) / (k1 - k0)));
  out.copy(c0).lerp(c1, t);
  // The north is drier: shift lowland colours toward ochre above ~1°N.
  const dryness = Math.min(1, Math.max(0, (lat - 1.0) / 2.5)) * (1 - Math.min(1, km / 2.4));
  return out.lerp(palette.dry, dryness * 0.8);
}

export function heightAt(x: number, z: number): number {
  return sample(fromScene(x, z)).km * VERTICAL_SCALE;
}

export function Terrain() {
  const geometry = useMemo(() => {
    const segmentsZ = Math.round((SEGMENTS_X * TERRAIN_DEPTH) / TERRAIN_WIDTH);
    const geo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, SEGMENTS_X, segmentsZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const ll = fromScene(pos.getX(i), pos.getZ(i));
      const { km, surface } = sample(ll);
      pos.setY(i, km * VERTICAL_SCALE);
      if (surface === "ocean") c.copy(palette.ocean);
      else if (surface === "lake") c.copy(palette.lake);
      else landColor(km, ll.lat, c);
      // Dim everything outside Kenya so the country reads as the subject.
      if (surface !== "ocean" && !isInsideKenya(ll)) c.multiplyScalar(0.55);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const border = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Densify each edge so the line follows the terrain instead of cutting through hills.
    for (let i = 0; i < KENYA_BORDER.length - 1; i++) {
      const [lng0, lat0] = KENYA_BORDER[i];
      const [lng1, lat1] = KENYA_BORDER[i + 1];
      const steps = 24;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const { x, z } = toScene({ lat: lat0 + (lat1 - lat0) * t, lng: lng0 + (lng1 - lng0) * t });
        points.push(new THREE.Vector3(x, Math.max(0, heightAt(x, z)) + 0.06, z));
      }
    }
    points.push(points[0].clone());
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: "#f4e7c8", transparent: true, opacity: 0.85 }),
    );
  }, []);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      <primitive object={border} />
    </group>
  );
}
