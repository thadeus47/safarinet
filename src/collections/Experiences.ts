import type { CollectionConfig, SelectField, TextFieldSingleValidation } from "payload";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks";

const monthDay: TextFieldSingleValidation = (value) =>
  !value || /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value) || "Use MM-DD, e.g. 07-01";

const basis: SelectField = {
  name: "basis",
  type: "select",
  required: true,
  defaultValue: "per_person",
  options: [
    { label: "Per person", value: "per_person" },
    { label: "Per group", value: "per_group" },
  ],
};

export const Experiences: CollectionConfig = {
  slug: "experiences",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "region", "partner", "type"],
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      type: "row",
      fields: [
        { name: "region", type: "relationship", relationTo: "regions", required: true, index: true },
        { name: "partner", type: "relationship", relationTo: "partners", required: true },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          options: [
            { label: "Game drive", value: "game_drive" },
            { label: "Guided walk", value: "guided_walk" },
            { label: "Cultural visit", value: "cultural_visit" },
            { label: "Day trip", value: "day_trip" },
            { label: "Activity", value: "activity" },
            { label: "Stay", value: "stay" },
          ],
        },
        { name: "durationHours", type: "number", required: true, min: 0.5 },
      ],
    },
    { name: "summary", type: "text", required: true, admin: { description: "One line, shown on cards." } },
    { name: "description", type: "textarea", required: true },
    {
      name: "location",
      type: "group",
      fields: [
        { type: "row", fields: [
          { name: "lat", type: "number", required: true, min: -90, max: 90 },
          { name: "lng", type: "number", required: true, min: -180, max: 180 },
        ] },
      ],
    },
    {
      name: "priceRules",
      type: "array",
      required: true,
      minRows: 1,
      admin: {
        description:
          "Prices in KES. A rule with a season beats the all-year rule on dates inside it; otherwise the cheapest rule that fits the group applies.",
      },
      fields: [
        { type: "row", fields: [basis, { name: "amountKes", type: "number", required: true, min: 0 }] },
        {
          type: "row",
          fields: [
            { name: "minGroup", type: "number", min: 1 },
            { name: "maxGroup", type: "number", min: 1 },
          ],
        },
        {
          name: "season",
          type: "group",
          admin: { description: "Leave empty for all year. Seasons can wrap the year end." },
          fields: [
            { type: "row", fields: [
              { name: "from", type: "text", validate: monthDay, admin: { placeholder: "07-01" } },
              { name: "to", type: "text", validate: monthDay, admin: { placeholder: "10-31" } },
              { name: "label", type: "text", admin: { placeholder: "Migration season" } },
            ] },
          ],
        },
      ],
    },
    {
      name: "fees",
      type: "array",
      admin: { description: "Itemised in the booking breakdown and included in the all-in price." },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "kind",
              type: "select",
              required: true,
              options: [
                { label: "Vehicle", value: "vehicle" },
                { label: "Guide", value: "guide" },
                { label: "Conservancy", value: "conservancy" },
                { label: "KWS park entry", value: "park_kws" },
              ],
            },
            { name: "label", type: "text", required: true },
          ],
        },
        { type: "row", fields: [basis, { name: "amountKes", type: "number", required: true, min: 0 }] },
      ],
    },
    {
      name: "rating",
      type: "group",
      admin: { description: "Imported for now; collected after completed bookings later." },
      fields: [
        { type: "row", fields: [
          { name: "average", type: "number", min: 0, max: 5 },
          { name: "count", type: "number", min: 0 },
        ] },
      ],
    },
  ],
};
