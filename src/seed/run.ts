import config from "@payload-config";
import { getPayload } from "payload";
import { experiences, partners, regions } from "./data";

// Loads the demo content into Payload. Safe to run repeatedly: records are matched on
// their slug (regions, experiences) or name (partners) and updated in place.
// Usage: npm run seed

const payload = await getPayload({ config });

async function upsert<C extends "regions" | "partners" | "experiences">(
  collection: C,
  field: "slug" | "name",
  value: string,
  data: Record<string, unknown>,
): Promise<number> {
  const existing = await payload.find({
    collection,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
  });
  const doc = existing.docs[0]
    ? await payload.update({ collection, id: existing.docs[0].id, data: data as never, depth: 0 })
    : await payload.create({ collection, data: data as never, depth: 0 });
  return doc.id as number;
}

const regionIds = new Map<string, number>();
for (const r of regions) {
  regionIds.set(
    r.slug,
    await upsert("regions", "slug", r.slug, {
      name: r.name,
      slug: r.slug,
      tagline: r.tagline,
      description: r.description,
      center: r.center,
      liteZoom: r.liteZoom,
    }),
  );
}

const partnerIds = new Map<string, number>();
for (const p of partners) {
  partnerIds.set(
    p.id,
    await upsert("partners", "name", p.name, {
      name: p.name,
      region: regionIds.get(p.regionSlug),
      contractSigned: p.contractSigned,
    }),
  );
}

for (const e of experiences) {
  await upsert("experiences", "slug", e.slug, {
    title: e.title,
    slug: e.slug,
    region: regionIds.get(e.regionSlug),
    partner: partnerIds.get(e.partnerId),
    type: e.type,
    durationHours: e.durationHours,
    summary: e.summary,
    description: e.description,
    location: e.location,
    priceRules: e.priceRules.map((r) => ({ ...r, season: r.season ?? {} })),
    fees: e.fees,
    rating: e.rating ?? {},
  });
}

payload.logger.info(
  `Seeded ${regions.length} regions, ${partners.length} partners, ${experiences.length} experiences`,
);
process.exit(0);
