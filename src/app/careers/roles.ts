// Open roles at GrantBridge Africa.
//
// The role-detail template (src/app/careers/[slug]/page.tsx) renders every
// field of a Role. There are NO open roles right now, so this list is empty
// on purpose — add a Role here when a real opening exists and the detail
// page, the openings list and the apply flow will pick it up. Do not invent
// roles, team members or locations.
export type Role = {
  slug: string;
  title: string;
  summary: string;
  team: string;
  location: string;
  type: string;
  aboutTheRole: string;
  whatYoullDo: string[];
  whatWereLookingFor: string[];
  niceToHave: string[];
};

export const ROLES: Role[] = [];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}
