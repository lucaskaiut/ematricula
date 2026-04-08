export type RouteAccessRule = {
  match: (pathname: string) => boolean;
  anyOf: string[];
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  {
    match: (p) => p === "/403",
    anyOf: [],
  },
  {
    match: (p) => p.startsWith("/users/new") || /\/users\/\d+\/edit$/.test(p),
    anyOf: ["users.write"],
  },
  {
    match: (p) => p.startsWith("/users"),
    anyOf: ["users.read", "users.write"],
  },
  {
    match: (p) =>
      p.startsWith("/perfis/new") || /\/perfis\/\d+\/edit$/.test(p),
    anyOf: ["roles.write"],
  },
  {
    match: (p) => p.startsWith("/perfis"),
    anyOf: ["roles.read", "roles.write"],
  },
  {
    match: (p) =>
      p.startsWith("/alunos/new") || /\/alunos\/\d+\/edit$/.test(p),
    anyOf: ["persons.write"],
  },
  {
    match: (p) => p.startsWith("/alunos"),
    anyOf: ["persons.read", "persons.write"],
  },
  {
    match: (p) =>
      p.startsWith("/professores/new") ||
      /\/professores\/\d+\/edit$/.test(p),
    anyOf: ["persons.write"],
  },
  {
    match: (p) => p.startsWith("/professores"),
    anyOf: ["persons.read", "persons.write"],
  },
  {
    match: (p) =>
      p.startsWith("/modalidades/new") ||
      /\/modalidades\/\d+\/edit$/.test(p),
    anyOf: ["modalities.write"],
  },
  {
    match: (p) => p.startsWith("/modalidades"),
    anyOf: ["modalities.read", "modalities.write"],
  },
  {
    match: (p) =>
      p.startsWith("/planos/new") || /\/planos\/\d+\/edit$/.test(p),
    anyOf: ["plans.write"],
  },
  {
    match: (p) => p.startsWith("/planos"),
    anyOf: ["plans.read", "plans.write"],
  },
  {
    match: (p) =>
      p.startsWith("/class-groups/new") ||
      /\/class-groups\/\d+\/edit$/.test(p),
    anyOf: ["class_groups.write"],
  },
  {
    match: (p) => p.startsWith("/class-groups"),
    anyOf: ["class_groups.read", "class_groups.write"],
  },
  {
    match: (p) =>
      p.startsWith("/matriculas/new") ||
      /\/matriculas\/\d+\/edit$/.test(p),
    anyOf: ["enrollments.write"],
  },
  {
    match: (p) => p.startsWith("/matriculas"),
    anyOf: ["enrollments.read", "enrollments.write"],
  },
  {
    match: (p) => p.startsWith("/configuracoes"),
    anyOf: ["settings.read", "settings.write"],
  },
  {
    match: (p) => p === "/" || p.startsWith("/agenda-demo"),
    anyOf: ["dashboard.access"],
  },
];

export function requiredPermissionsForPath(pathname: string): string[] | null {
  for (const rule of ROUTE_ACCESS_RULES) {
    if (rule.match(pathname)) {
      return rule.anyOf;
    }
  }
  return null;
}
