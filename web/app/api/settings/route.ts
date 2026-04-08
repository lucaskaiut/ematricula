import { Api } from '@/lib/api';

export async function GET() {
  const api = new Api('/settings');
  const response = await api.get();
  return Response.json(response);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const api = new Api('/settings');
  const response = await api.put(body);
  return Response.json(response);
}
