// Decorative topographic contour lines, drawn as SVG so they stay crisp and cost no image download.

function contour(cx: number, cy: number, r: number, seed: number): string {
  const points: string[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    // A few low-frequency waves make each ring look like terrain rather than a circle.
    const wobble =
      1 + 0.09 * Math.sin(3 * a + seed) + 0.05 * Math.sin(5 * a + seed * 1.7) + 0.03 * Math.sin(9 * a + seed * 0.6);
    const x = cx + Math.cos(a) * r * wobble * 1.25;
    const y = cy + Math.sin(a) * r * wobble;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join("L")}Z`;
}

const PEAKS = [
  { cx: 260, cy: 260, rings: 11, seed: 1.3 },
  { cx: 860, cy: 640, rings: 13, seed: 4.1 },
];

const PATHS = PEAKS.flatMap(({ cx, cy, rings, seed }) =>
  Array.from({ length: rings }, (_, i) => contour(cx, cy, 28 + i * 34, seed + i * 0.35)),
);

export function ContourBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1100 900"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" className="text-sand/10">
        {PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
