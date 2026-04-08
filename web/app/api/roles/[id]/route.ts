import { Api } from "@/lib/api";
import type { RoleAttributes } from "@/types/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const api = new Api(`/roles/${id}`);
  const response = await api.get<RoleAttributes>();
  return Response.json(response);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const api = new Api(`/roles/${id}`);
  const response = await api.patch<RoleAttributes>(body);
  return Response.json(response);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const api = new Api(`/roles/${id}`);
  await api.delete();
  return new Response(null, { status: 204 });
}
