import { Api } from '@/lib/api';
import type { SubscriptionAttributes } from '@/types/api';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const api = new Api(`/subscriptions/${id}/generate-next-invoice`);
  const response = await api.post<SubscriptionAttributes>({});

  return Response.json(response);
}
