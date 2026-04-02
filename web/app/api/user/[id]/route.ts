import { Api } from '@/lib/api';
import type { UserAttributes } from '@/types/api';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Partial<UserAttributes>;

  const api = new Api(`/users/${id}`);
  const response = await api.patch<UserAttributes>(body);

  return Response.json(response);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const api = new Api(`/users/${id}`);
  const response = await api.delete<unknown>();

  return Response.json(response);
}

