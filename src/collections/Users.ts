import type { CollectionConfig } from "payload";

/** Staff who use the admin. Partners don't log in yet (PRD: we onboard them ourselves). */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", group: "Admin" },
  fields: [{ name: "name", type: "text" }],
};
