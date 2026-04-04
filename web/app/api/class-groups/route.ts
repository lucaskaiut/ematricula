import { Api } from '@/lib/api';
import type { ClassGroupAttributes } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api('/class-groups');
  const response = await api.get<ClassGroupAttributes[]>(searchParams);

  return Response.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  const api = new Api('/class-groups');
  const response = await api.post<ClassGroupAttributes>(body);

  return Response.json(response);
}
