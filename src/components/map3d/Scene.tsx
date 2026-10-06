"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import type { MapRegion } from "@/components/map/types";
import { TERRAIN_DEPTH, TERRAIN_WIDTH } from "@/lib/geo";
import { CameraRig } from "./CameraRig";
import { PinOverlay, PinProjector } from "./RegionPins";
import { Terrain } from "./Terrain";

export default function Scene({
  regions,
  selected,
  onSelect,
}: {
  regions: MapRegion[];
  selected: MapRegion | null;
  onSelect: (slug: string) => void;
}) {
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  return (
    <div className="absolute inset-0">
      <Canvas
        frameloop="demand"
        // Capped pixel ratio keeps mid-range phones near 30 fps (see performance budgets).
        dpr={[1, 1.5]}
        camera={{ fov: 40, near: 0.5, far: 500, position: [0, 95, 100] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        aria-label="3D map of Kenya"
      >
        <color attach="background" args={["#0d1712"]} />
        <fog attach="fog" args={["#0d1712", 130, 260]} />
        <hemisphereLight args={["#fff3dc", "#2b3a2a", 0.9]} />
        <directionalLight position={[-40, 60, 30]} intensity={1.6} color="#ffe6bf" />
        <Terrain />
        {/* Sea beyond the terrain edge, so the coast doesn't end in a cliff. */}
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
          <planeGeometry args={[TERRAIN_WIDTH * 4, TERRAIN_DEPTH * 4]} />
          <meshStandardMaterial color="#173c53" roughness={0.6} />
        </mesh>
        <PinProjector regions={regions} pinRefs={pinRefs} />
        <CameraRig selected={selected} />
      </Canvas>
      <PinOverlay regions={regions} selected={selected} onSelect={onSelect} pinRefs={pinRefs} />
    </div>
  );
}
