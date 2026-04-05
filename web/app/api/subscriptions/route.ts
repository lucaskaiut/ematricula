import { Api } from '@/lib/api';
import type { SubscriptionAttributes } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api('/subscriptions');
  const response = await api.get<SubscriptionAttributes[]>(searchParams);

  return Response.json(response);
}
