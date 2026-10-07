# Safarinet

An immersive 3D map of Kenya where travellers explore regions and book local experiences, paying by card or M-Pesa.

Product requirements and the technical build plan live in `docs/`, which is kept local and not committed.

## Run it

```bash
npm install          # also copies the MapLibre worker into public/vendor
cp .env.example .env.local   # then set DATABASE_URL (Neon, pooled) and PAYLOAD_SECRET
npm run migrate      # apply database migrations to Neon
npm run seed         # optional: load the demo regions, partners and experiences
npm run dev          # site at http://localhost:3000, admin at /admin
npm test             # pricing unit tests
npm run build        # needs DATABASE_URL: pages are generated from Payload content
```

On the first visit to `/admin`, Payload asks you to create the first admin user.

### Changing the content model

Collections live in `src/collections/`. After changing one:

```bash
npm run migrate:create <name>   # writes a migration to src/migrations/
npm run migrate                 # applies it
npm run generate:types          # refreshes src/payload-types.ts
```

The database never auto-pushes schema changes (`push: false`), so every environment changes only through migrations.

## What's built (Foundations + first map slice)

| Area | Where | Notes |
| --- | --- | --- |
| 3D terrain map, slow drift, GSAP fly-in | `src/components/map3d/` | React Three Fiber. Terrain is procedural (`src/lib/terrain/procedural.ts`) until the DEM pipeline lands |
| Region pins | `src/components/map3d/RegionPins.tsx` | DOM buttons projected from 3D each frame, so they are tappable and accessible |
| Lite mode (flat 2D map) | `src/components/maplite/LiteMap.tsx` | MapLibre + OpenFreeMap; three.js is never downloaded |
| Mode detection and toggle | `src/lib/device/detectMode.ts` | Save-Data, slow connection, low memory, no WebGL or a low GPU tier → lite; the manual choice is stored in a cookie |
| Region hub panel and pages | `src/components/map/RegionPanel.tsx`, `src/app/(site)/[region]` | Regions with fewer than 5 signed partners show "coming soon" |
| Experience pages | `src/app/(site)/[region]/[experience]` | Static; media are placeholders until Cloudinary |
| Request-to-book form with live pricing | `src/app/(site)/book/...`, `src/components/booking/BookingForm.tsx` | Payments not connected yet |
| Pricing engine | `src/lib/pricing/quote.ts` | Per-person / per-group, seasons (including year-wrap), fees; unit-tested |
| Payload CMS admin | `/admin`, `src/payload.config.ts`, `src/collections/` | Regions, partners, experiences (pricing rules and fees), staff users. Partners are readable by staff only |
| Neon Postgres | `@payloadcms/db-postgres`, `src/migrations/` | Schema managed by migrations |
| Content layer | `src/lib/content/repo.ts` | Reads Payload through its local API and maps documents to domain types. Saving in the admin revalidates the site |

Seed partners and prices (`src/seed/data.ts`, loaded by `npm run seed`) are demo placeholders, not real operators or quotes.

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
