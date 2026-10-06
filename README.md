# Safarinet

An immersive 3D map of Kenya where travellers explore regions and book local experiences, paying by card or M-Pesa.

Product requirements and the technical build plan live in `docs/`, which is kept local and not committed.

## Run it

```bash
npm install        # also copies the MapLibre worker into public/vendor
npm run dev        # http://localhost:3000
npm test           # pricing unit tests
npm run build
```

Copy `.env.example` to `.env.local` to override defaults.

## What's built (Foundations + first map slice)

| Area | Where | Notes |
| --- | --- | --- |
| 3D terrain map, slow drift, GSAP fly-in | `src/components/map3d/` | React Three Fiber. Terrain is procedural (`src/lib/terrain/procedural.ts`) until the DEM pipeline lands |
| Region pins | `src/components/map3d/RegionPins.tsx` | DOM buttons projected from 3D each frame, so they are tappable and accessible |
| Lite mode (flat 2D map) | `src/components/maplite/LiteMap.tsx` | MapLibre + OpenFreeMap; three.js is never downloaded |
| Mode detection and toggle | `src/lib/device/detectMode.ts` | Save-Data, slow connection, low memory, no WebGL or a low GPU tier → lite; the manual choice is stored in a cookie |
| Region hub panel and pages | `src/components/map/RegionPanel.tsx`, `src/app/[region]` | Regions with fewer than 5 signed partners show "coming soon" |
| Experience pages | `src/app/[region]/[experience]` | Static; media are placeholders until Cloudinary |
| Request-to-book form with live pricing | `src/app/book/...`, `src/components/booking/BookingForm.tsx` | Payments not connected yet |
| Pricing engine | `src/lib/pricing/quote.ts` | Per-person / per-group, seasons (including year-wrap), fees; unit-tested |
| Content layer | `src/lib/content/` | Typed seed data behind `repo.ts`; swap for Payload's local API |

Seed partners and prices are demo placeholders, not real operators or quotes.

## Ambient sound

Each map scene (the Kenya overview and every region) has its own soundscape, and the map crossfades between them as you fly around. Sound stays off until the visitor taps **Enter with sound**, because browsers block autoplay audio. After that a mute toggle stays visible.

| Piece | Where |
| --- | --- |
| Scene → soundscape list | `src/lib/audio/soundscapes.ts` |
| Crossfading engine (Web Audio) | `src/lib/audio/AmbientEngine.ts` |
| Generated stand-in layers: wind, surf, insects, birds | `src/lib/audio/synth.ts` |
| Enter / mute control | `src/components/audio/SoundControl.tsx` |

The current sounds are **generated in code** as stand-ins. They download nothing, but they're impressions, not real Kenyan wildlife.

### Adding real recordings

1. Get recordings you have the rights to use commercially on the web:
   - Best: record or commission recordings in each region from Kenyan field recordists, and buy the rights outright.
   - Good: licensed libraries whose licence covers web streaming.
   - Free: Freesound with the licence filter set to Creative Commons 0.
   - Avoid: YouTube rips and anything licensed for non-commercial use only.
2. Edit each one into a seamless 60–120 s loop, levelled consistently across regions, and export as AAC or Opus at about 96 kbps (roughly 1 MB per minute).
3. Upload to the CDN, then set `recording: { src, credit }` on that scene in `soundscapes.ts`.

Recordings are fetched only after sound is switched on. If one fails to load, that scene falls back to its generated sound.

## Next steps (from the build plan)

1. Payload CMS + Neon Postgres, replacing `src/lib/content/seed.ts`
2. Paystack deposits, booking state machine and the Vercel Workflow 24-hour confirm-or-refund timer
3. Partner notifications (Resend, WhatsApp) with signed confirm/decline links
4. Save and share itineraries, contact capture
5. Real terrain: DEM → glTF pipeline in `scripts/terrain/`
6. PostHog events, Sentry, Playwright end-to-end tests
