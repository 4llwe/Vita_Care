export type AuthActor = { id: string; role: string; roles?: string[] };
export function actorRoles(actor: Pick<AuthActor, "role" | "roles">): Set<string> {
  return new Set([actor.role, ...(Array.isArray(actor.roles) ? actor.roles : [])]);
}
export function actorHasAnyRole(
  actor: Pick<AuthActor, "role" | "roles">,
  roles: string[],
): boolean {
  const effectiveRoles = actorRoles(actor);
  return roles.some((role) => effectiveRoles.has(role));
}
export const CLINICAL_ROLES = ["HEALTH_WORKER", "DOCTOR", "NURSE"];