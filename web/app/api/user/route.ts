import { Api } from '@/lib/api';
import { UserAttributes } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api('/users');
  const response = await api.get<UserAttributes[]>(searchParams);

  return Response.json(response);
}