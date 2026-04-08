import { Api } from "@/lib/api";
import type { RoleAttributes } from "@/types/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const api = new Api("/roles");
  const response = await api.get<RoleAttributes[]>(searchParams);
  return Response.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const api = new Api("/roles");
  const response = await api.post<RoleAttributes>(body);
  return Response.json(response);
}
