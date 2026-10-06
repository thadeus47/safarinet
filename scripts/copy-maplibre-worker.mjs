// MapLibre v6 loads its web worker from a URL next to its own module, which the
// bundler doesn't emit. Copy the worker (and the chunk it imports) into public/ so
// LiteMap can point setWorkerUrl() at a stable path. Runs on postinstall.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules/maplibre-gl/dist");
const to = join(root, "public/vendor/maplibre");

mkdirSync(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(from, file), join(to, file));
}
console.log("Copied MapLibre worker to public/vendor/maplibre");
