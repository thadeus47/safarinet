import type { CollectionConfig } from "payload";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks";

export const Regions: CollectionConfig = {
  slug: "regions",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "tagline"],
    description: "A region goes live on the map once it has 5 partners with signed contracts.",
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "Used in the URL, e.g. maasai-mara" },
    },
    { name: "tagline", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    {
      name: "center",
      type: "group",
      admin: { description: "Where the map pin sits and the camera flies to." },
      fields: [
        { type: "row", fields: [
          { name: "lat", type: "number", required: true, min: -90, max: 90 },
          { name: "lng", type: "number", required: true, min: -180, max: 180 },
        ] },
      ],
    },
    {
      name: "liteZoom",
      type: "number",
      required: true,
      defaultValue: 9,
      min: 5,
      max: 14,
      admin: { description: "Zoom level for the flat 2D map when this region is selected." },
    },
  ],
};
