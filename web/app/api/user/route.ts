import { Api } from '@/lib/api';
import { UserAttributes } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api('/users');
  const response = await api.get<UserAttributes[]>(searchParams);

  return Response.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name: string; email: string; password: string };

  const api = new Api('/users');
  const response = await api.post<UserAttributes>(body);

  return Response.json(response);
}