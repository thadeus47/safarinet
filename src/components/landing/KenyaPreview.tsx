import type { MapRegion } from "@/components/map/types";
import { KENYA_BOUNDS } from "@/lib/geo";

// A simplified outline of Kenya (lat, lng), traced clockwise from the north-west.
// Decorative only: the real map is behind sign-in.
const OUTLINE: [number, number][] = [
  [4.62, 34.0], [4.85, 35.3], [4.45, 36.05], [4.45, 36.85], [3.6, 38.1], [3.5, 39.55],
  [3.95, 40.75], [3.94, 41.86], [2.8, 40.99], [-0.86, 40.99], [-1.68, 41.56], [-2.27, 40.9],
  [-3.22, 40.12], [-4.04, 39.67], [-4.68, 39.2], [-3.07, 37.6], [-1.0, 34.07], [-0.1, 33.95],
  [0.46, 34.09], [1.13, 34.55], [2.0, 35.0], [3.9, 34.4],
];

const W = 400;
const H = (W * (KENYA_BOUNDS.north - KENYA_BOUNDS.south)) / (KENYA_BOUNDS.east - KENYA_BOUNDS.west);

function project(lat: number, lng: number) {
  return {
    x: ((lng - KENYA_BOUNDS.west) / (KENYA_BOUNDS.east - KENYA_BOUNDS.west)) * W,
    y: ((KENYA_BOUNDS.north - lat) / (KENYA_BOUNDS.north - KENYA_BOUNDS.south)) * H,
  };
}

const OUTLINE_PATH =
  OUTLINE.map(([lat, lng], i) => {
    const { x, y } = project(lat, lng);
    return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join("") + "Z";

/** The hero's picture: Kenya with every region we cover, placed where it really is. */
export function KenyaPreview({ regions }: { regions: MapRegion[] }) {
  return (
    <figure className="relative mx-auto w-full max-w-md">
      <svg viewBox={`-20 -20 ${W + 40} ${H + 40}`} className="w-full" role="img" aria-labelledby="kenya-preview-title">
        <title id="kenya-preview-title">
          {`Map of Kenya showing ${regions.length} regions: ${regions.map((r) => r.name).join(", ")}`}
        </title>
        <defs>
          <linearGradient id="kenya-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3d5e34" />
            <stop offset="0.55" stopColor="#5b6b3a" />
            <stop offset="1" stopColor="#9a7a45" />
          </linearGradient>
          <filter id="kenya-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <path d={OUTLINE_PATH} fill="#c2621c" opacity="0.25" filter="url(#kenya-glow)" />
        <path d={OUTLINE_PATH} fill="url(#kenya-land)" stroke="#f6efe1" strokeOpacity="0.35" strokeWidth="1.5" />
        {regions.map((r) => {
          const { x, y } = project(r.center.lat, r.center.lng);
          const live = r.status === "live";
          return (
            <g key={r.slug} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
              {live && (
                <circle r="7" fill="#c2621c" className="origin-center [transform-box:fill-box] motion-safe:animate-ping" opacity="0.6" />
              )}
              <circle r="6" fill={live ? "#c2621c" : "#8b8f86"} stroke="#f6efe1" strokeWidth="2" />
            </g>
          );
        })}
      </svg>
      {/* Labels as HTML, so they stay readable at any size. */}
      {regions.map((r) => {
        const { x, y } = project(r.center.lat, r.center.lng);
        const left = ((x + 20) / (W + 40)) * 100;
        const top = ((y + 20) / (H + 40)) * 100;
        // Labels sit right of their pin, except near the east coast (left, to stay inside the
        // figure) and in the far west (below, so they don't cover Nairobi's pin).
        const style =
          left > 60
            ? { right: `calc(${100 - left}% + 12px)`, top: `${top}%` }
            : left < 25
              ? { left: `${left}%`, top: `calc(${top}% + 12px)`, translate: "-50% 0" }
              : { left: `calc(${left}% + 12px)`, top: `${top}%` };
        return (
          <span
            key={r.slug}
            aria-hidden="true"
            className="absolute -translate-y-1/2 rounded-full bg-night/80 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-sand backdrop-blur"
            style={style}
          >
            {r.name}
            {r.status !== "live" && <span className="ml-1 text-sand/60">· soon</span>}
          </span>
        );
      })}
    </figure>
  );
}
