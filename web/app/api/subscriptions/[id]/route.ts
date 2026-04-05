import { Api } from '@/lib/api';
import type { SubscriptionAttributes } from '@/types/api';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const api = new Api(`/subscriptions/${id}`);
  const response = await api.get<SubscriptionAttributes>();

  return Response.json(response);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const api = new Api(`/subscriptions/${id}`);
  const response = await api.patch<SubscriptionAttributes>(body);

  return Response.json(response);
}
