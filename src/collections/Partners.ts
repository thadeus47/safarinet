import type { CollectionConfig } from "payload";
import { revalidateAfterChange, revalidateAfterDelete } from "./hooks";

export const Partners: CollectionConfig = {
  slug: "partners",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "region", "contractSigned"],
  },
  // Partner records hold contact and payout details, so only staff can read them.
  // The site counts signed partners server-side through the local API.
  access: { read: ({ req }) => Boolean(req.user) },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    { name: "region", type: "relationship", relationTo: "regions", required: true, index: true },
    {
      name: "contractSigned",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Only signed partners count toward a region going live." },
    },
    {
      name: "contact",
      type: "group",
      fields: [
        { type: "row", fields: [
          { name: "whatsapp", type: "text" },
          { name: "email", type: "email" },
        ] },
      ],
    },
    {
      name: "commissionPercent",
      type: "number",
      min: 0,
      max: 100,
      admin: { description: "Open question in the PRD; set per partner contract." },
    },
    {
      name: "paystackSubaccount",
      type: "text",
      admin: { description: "Paystack subaccount code, used for split payments." },
    },
  ],
};
