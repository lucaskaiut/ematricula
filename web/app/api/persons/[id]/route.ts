import { Api } from '@/lib/api';
import type { PersonAttributes } from '@/types/api';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const api = new Api(`/persons/${id}`);
  const response = await api.get<PersonAttributes>();

  return Response.json(response);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const api = new Api(`/persons/${id}`);
  const response = await api.patch<PersonAttributes>(body);

  return Response.json(response);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  const api = new Api(`/persons/${id}`);
  const response = await api.delete<unknown>();

  return Response.json(response);
}
