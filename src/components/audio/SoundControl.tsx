"use client";

import { useEffect, useRef, useState } from "react";
import { AmbientEngine } from "@/lib/audio/AmbientEngine";
import { soundscapeFor } from "@/lib/audio/soundscapes";

type State = "off" | "on" | "muted";

/**
 * Sound is off until the visitor opts in (PRD MAP-5). After that a mute toggle stays
 * visible, and the soundscape follows the map: `scene` is the selected region or
 * "overview".
 */
export function SoundControl({ scene }: { scene: string }) {
  const engine = useRef<AmbientEngine | null>(null);
  const [state, setState] = useState<State>("off");

  useEffect(() => {
    if (state === "on") engine.current?.play(scene);
  }, [scene, state]);

  useEffect(() => () => engine.current?.dispose(), []);

  const enter = () => {
    engine.current ??= new AmbientEngine();
    void engine.current.start(scene);
    setState("on");
  };

  const toggleMute = () => {
    const next: State = state === "on" ? "muted" : "on";
    engine.current?.setMuted(next === "muted");
    if (next === "on") engine.current?.play(scene);
    setState(next);
  };

  if (state === "off") {
    return (
      <button
        type="button"
        onClick={enter}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-acacia px-4 py-2 text-xs font-medium text-sand shadow-lg hover:bg-acacia/90"
      >
        <SpeakerIcon on />
        Enter with sound
      </button>
    );
  }

  const on = state === "on";
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-night/70 py-1.5 pr-4 pl-1.5 text-xs text-sand backdrop-blur">
      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={!on}
        aria-label={on ? "Mute sound" : "Unmute sound"}
        className="grid size-8 place-items-center rounded-full bg-sand/10 hover:bg-sand/20"
      >
        <SpeakerIcon on={on} />
      </button>
      <span aria-live="polite" className="max-w-[180px] truncate sm:max-w-none">
        {on ? soundscapeFor(scene).label : "Sound off"}
      </span>
    </div>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
      ) : (
        <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
      )}
    </svg>
  );
}
