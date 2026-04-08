import { Api } from "@/lib/api";
import type { PermissionDefinition } from "@/types/api";

export async function GET() {
  const api = new Api("/acl/permissions");
  const response = await api.get<PermissionDefinition[]>();
  return Response.json(response);
}
