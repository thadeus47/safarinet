import { soundscapeFor } from "./soundscapes";
import type { StopFn } from "./synth";

const CROSSFADE_S = 3;
const MASTER_LEVEL = 0.8;

type Playing = { scene: string; bus: GainNode; stops: StopFn[] };

/**
 * Plays one soundscape at a time and crossfades between them as the map moves.
 * Must be started from a user gesture: browsers block audio until the visitor taps.
 */
export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private current: Playing | null = null;
  private muted = false;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private onVisibility = () => this.syncSuspended();

  /** Call inside a click/tap handler. */
  async start(scene: string) {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      document.addEventListener("visibilitychange", this.onVisibility);
    }
    await this.ctx.resume();
    this.setMuted(false);
    this.play(scene);
  }

  get started() {
    return this.ctx !== null;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_LEVEL, now + (muted ? 0.4 : 1.5));
    this.syncSuspended();
  }

  /** Crossfades to `scene`. A no-op if it is already playing. */
  play(scene: string) {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.current?.scene === scene) return;
    const now = ctx.currentTime;

    if (this.current) {
      const old = this.current;
      old.bus.gain.cancelScheduledValues(now);
      old.bus.gain.setValueAtTime(old.bus.gain.value, now);
      old.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);
      old.stops.forEach((stop) => stop(now + CROSSFADE_S + 0.1));
      setTimeout(() => old.bus.disconnect(), (CROSSFADE_S + 0.5) * 1000);
    }

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + CROSSFADE_S);
    bus.connect(this.master);
    const playing: Playing = { scene, bus, stops: [] };
    this.current = playing;

    const soundscape = soundscapeFor(scene);
    if (soundscape.recording) {
      // Fall back to the synth if the file can't load (offline, missing, blocked).
      this.loadBuffer(soundscape.recording.src).then((buffer) => {
        if (this.current !== playing) return;
        if (buffer) {
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(bus);
          src.start();
          playing.stops.push((when) => src.stop(when));
        } else {
          playing.stops.push(...soundscape.synth(ctx, bus));
        }
      });
    } else {
      playing.stops.push(...soundscape.synth(ctx, bus));
    }
  }

  dispose() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.current?.stops.forEach((stop) => stop(0));
    this.current = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  /** Recordings are fetched only once sound is on, and cached for the session. */
  private loadBuffer(src: string): Promise<AudioBuffer | null> {
    let pending = this.buffers.get(src);
    if (!pending) {
      const ctx = this.ctx!;
      pending = fetch(src)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${src}`))))
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null);
      this.buffers.set(src, pending);
    }
    return pending;
  }

  /** Silence the CPU work entirely when muted or when the tab is in the background. */
  private syncSuspended() {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (this.muted) setTimeout(() => this.muted && this.ctx?.suspend(), 500);
    else void this.ctx.resume();
  }
}
