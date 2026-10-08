import type { Access, CollectionConfig } from "payload";

const isStaff: Access = ({ req }) => req.user?.collection === "users";

/** A traveler may see and edit only their own account; staff see everyone. */
const selfOrStaff: Access = ({ req }) => {
  if (req.user?.collection === "users") return true;
  if (req.user?.collection === "travelers") return { id: { equals: req.user.id } };
  return false;
};

/**
 * Visitors who sign up on the site. Signing in unlocks the map. Kept apart from
 * `users` so a traveler account can never reach the admin.
 */
export const Travelers: CollectionConfig = {
  slug: "travelers",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  admin: { useAsTitle: "email", group: "Customers", defaultColumns: ["name", "email", "createdAt"] },
  access: {
    // Sign-up runs through the site's server action (local API), not the REST API.
    create: isStaff,
    read: selfOrStaff,
    update: selfOrStaff,
    delete: isStaff,
    admin: () => false,
  },
  fields: [{ name: "name", type: "text", required: true, maxLength: 80 }],
};
