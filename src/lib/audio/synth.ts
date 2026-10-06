// Synthesised ambience layers built from Web Audio nodes. They are stand-ins for real
// field recordings: they cost no data and work in lite mode, but they are impressions,
// not real Kenyan wildlife. Each layer connects to `out` and returns a stop function.

export type StopFn = (when: number) => void;

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** A few seconds of brown noise: deep, rumbly, good for wind, surf and distant hum. */
function brownNoise(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;
  const length = ctx.sampleRate * 6;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  noiseCache.set(ctx, buffer);
  return buffer;
}

function noiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = brownNoise(ctx);
  src.loop = true;
  // Start each layer at a random point so stacked layers don't phase together.
  src.start(ctx.currentTime, Math.random() * 5);
  return src;
}

/** A slow sine LFO driving an AudioParam around its current value. */
function lfo(ctx: AudioContext, param: AudioParam, hz: number, depth: number): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.frequency.value = hz;
  const amount = ctx.createGain();
  amount.gain.value = depth;
  osc.connect(amount).connect(param);
  osc.start();
  return osc;
}

/** Wind: filtered brown noise that swells and gusts. */
export function wind(ctx: AudioContext, out: AudioNode, level: number, brightness = 500): StopFn {
  const src = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = brightness;
  const gain = ctx.createGain();
  gain.gain.value = level * 0.35;
  src.connect(filter).connect(gain).connect(out);
  const swell = lfo(ctx, gain.gain, 0.06 + Math.random() * 0.04, level * 0.2);
  const gust = lfo(ctx, filter.frequency, 0.11, brightness * 0.5);
  return (when) => [src, swell, gust].forEach((n) => n.stop(when));
}

/** Surf or lake water: noise that rises and falls like waves arriving. */
export function waves(
  ctx: AudioContext,
  out: AudioNode,
  level: number,
  { period = 9, brightness = 900 }: { period?: number; brightness?: number } = {},
): StopFn {
  const src = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = brightness;
  const gain = ctx.createGain();
  gain.gain.value = level * 0.3;
  src.connect(filter).connect(gain).connect(out);
  const swell = lfo(ctx, gain.gain, 1 / period, level * 0.28);
  const wash = lfo(ctx, filter.frequency, 1 / period, brightness * 0.6);
  return (when) => [src, swell, wash].forEach((n) => n.stop(when));
}

/** Distant low hum, for the edge of the city. */
export function hum(ctx: AudioContext, out: AudioNode, level: number): StopFn {
  const src = noiseSource(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 160;
  const gain = ctx.createGain();
  gain.gain.value = level * 0.5;
  src.connect(filter).connect(gain).connect(out);
  return (when) => src.stop(when);
}

/** Crickets and cicadas: high tones pulsed at a fast chirp rate, in slow phrases. */
export function insects(ctx: AudioContext, out: AudioNode, level: number): StopFn {
  const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const voices = [
    { hz: 4400, chirp: 18, phrase: 0.45, pan: -0.6 },
    { hz: 4950, chirp: 23, phrase: 0.3, pan: 0.5 },
    { hz: 3900, chirp: 14, phrase: 0.6, pan: 0.1 },
  ];
  for (const v of voices) {
    const tone = ctx.createOscillator();
    tone.frequency.value = v.hz;
    const chirpGain = ctx.createGain();
    chirpGain.gain.value = 0.5;
    const phraseGain = ctx.createGain();
    phraseGain.gain.value = level * 0.012;
    const pan = ctx.createStereoPanner();
    pan.pan.value = v.pan;
    tone.connect(chirpGain).connect(phraseGain).connect(pan).connect(out);
    tone.start();
    nodes.push(tone, lfo(ctx, chirpGain.gain, v.chirp, 0.5), lfo(ctx, phraseGain.gain, v.phrase, level * 0.012));
  }
  return (when) => nodes.forEach((n) => n.stop(when));
}

export type BirdCall = "trill" | "whistle" | "coo";

/** Schedules one bird call at `t`. Shapes are loose impressions of common calls. */
function playCall(ctx: AudioContext, out: AudioNode, call: BirdCall, t: number, level: number) {
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.6 - 0.8;
  pan.connect(out);

  const note = (start: number, from: number, to: number, dur: number, peak: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, dur / 4));
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(env).connect(pan);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  };

  const pitch = 0.85 + Math.random() * 0.3;
  if (call === "trill") {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      note(t + i * 0.09, 2600 * pitch, 3700 * pitch, 0.07, level * 0.05);
    }
  } else if (call === "whistle") {
    // A clear two-part whistle, high then sliding down.
    note(t, 1900 * pitch, 2300 * pitch, 0.25, level * 0.045);
    note(t + 0.32, 2200 * pitch, 1300 * pitch, 0.5, level * 0.04);
  } else {
    // A soft dove-like coo: three low notes.
    for (let i = 0; i < 3; i++) {
      note(t + i * 0.42, 620 * pitch, 560 * pitch, i === 1 ? 0.45 : 0.3, level * 0.07);
    }
  }
}

/** Random bird calls, roughly `perMinute` of them, drawn from `calls`. */
export function birds(
  ctx: AudioContext,
  out: AudioNode,
  level: number,
  calls: BirdCall[],
  perMinute: number,
): StopFn {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const meanGap = 60 / perMinute;
  const next = () => {
    if (stopped) return;
    const call = calls[Math.floor(Math.random() * calls.length)];
    playCall(ctx, out, call, ctx.currentTime + 0.05, level);
    timer = setTimeout(next, (meanGap * (0.4 + Math.random() * 1.2)) * 1000);
  };
  timer = setTimeout(next, Math.random() * meanGap * 600);
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
