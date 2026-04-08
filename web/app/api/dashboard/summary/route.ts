import { Api } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api("/dashboard/summary");
  const response = await api.get<DashboardSummary>(searchParams);

  return Response.json(response);
}

