import { birds, hum, insects, type StopFn, waves, wind } from "./synth";

// One soundscape per map scene: the Kenya overview plus each region.
//
// `recording` is the real thing: a seamless 60-120 s loop of field audio from that place,
// served from the CDN. Until a region has one, its `synth` stand-in plays instead.
// Only use recordings we have the rights to; see "Adding real recordings" in the README.

export type Soundscape = {
  /** Shown next to the mute button, e.g. "Maasai Mara · savanna at dusk". */
  label: string;
  recording?: { src: string; credit: string };
  synth: (ctx: AudioContext, out: AudioNode) => StopFn[];
};

export const OVERVIEW_SCENE = "overview";

export const soundscapes: Record<string, Soundscape> = {
  [OVERVIEW_SCENE]: {
    label: "Kenya · wind over the plains",
    synth: (ctx, out) => [
      wind(ctx, out, 0.55, 450),
      insects(ctx, out, 0.25),
      birds(ctx, out, 0.5, ["whistle", "coo"], 5),
    ],
  },
  nairobi: {
    label: "Nairobi National Park · morning birdsong",
    synth: (ctx, out) => [
      hum(ctx, out, 0.25),
      wind(ctx, out, 0.25, 600),
      birds(ctx, out, 0.8, ["trill", "coo", "whistle"], 16),
    ],
  },
  "maasai-mara": {
    label: "Maasai Mara · savanna at dusk",
    synth: (ctx, out) => [
      wind(ctx, out, 0.45, 420),
      insects(ctx, out, 0.7),
      birds(ctx, out, 0.6, ["whistle", "coo"], 7),
    ],
  },
  coast: {
    label: "The Coast · Indian Ocean surf",
    synth: (ctx, out) => [
      waves(ctx, out, 0.45, { period: 9, brightness: 1100 }),
      wind(ctx, out, 0.25, 700),
      birds(ctx, out, 0.4, ["trill"], 4),
    ],
  },
  tsavo: {
    label: "Tsavo · dry heat and cicadas",
    synth: (ctx, out) => [
      wind(ctx, out, 0.5, 380),
      insects(ctx, out, 0.9),
      birds(ctx, out, 0.5, ["coo"], 5),
    ],
  },
  naivasha: {
    label: "Lake Naivasha · water and fish eagles",
    synth: (ctx, out) => [
      waves(ctx, out, 0.45, { period: 4, brightness: 550 }),
      wind(ctx, out, 0.3, 500),
      birds(ctx, out, 0.7, ["whistle", "trill"], 9),
    ],
  },
  "mt-kenya": {
    label: "Mt Kenya · high mountain wind",
    synth: (ctx, out) => [
      wind(ctx, out, 0.5, 750),
      birds(ctx, out, 0.4, ["whistle"], 3),
    ],
  },
};

export function soundscapeFor(scene: string): Soundscape {
  return soundscapes[scene] ?? soundscapes[OVERVIEW_SCENE];
}
