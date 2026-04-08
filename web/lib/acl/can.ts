import type { AuthedUser } from "@/actions/auth";

export function userHasAnyPermission(
  user: AuthedUser | null,
  anyOf: string[],
): boolean {
  if (anyOf.length === 0) {
    return true;
  }
  const granted = user?.permissions;
  if (!granted?.length) {
    return false;
  }
  return anyOf.some((k) => granted.includes(k));
}

export function canAccessPath(
  user: AuthedUser | null,
  pathname: string,
  rules: { match: (p: string) => boolean; anyOf: string[] }[],
): boolean {
  for (const rule of rules) {
    if (rule.match(pathname)) {
      return userHasAnyPermission(user, rule.anyOf);
    }
  }
  return false;
}
