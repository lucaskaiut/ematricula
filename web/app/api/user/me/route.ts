import { Api } from "@/lib/api";
import type { UserAttributes } from "@/types/api";

export async function PATCH(request: Request) {
  const formData = await request.formData();
  const api = new Api("/user/me");
  const response = await api.patch<UserAttributes>(formData);
  return Response.json(response);
}
