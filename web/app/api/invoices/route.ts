import { Api } from '@/lib/api';
import type { InvoiceAttributes } from '@/types/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const api = new Api('/invoices');
  const response = await api.get<InvoiceAttributes[]>(searchParams);

  return Response.json(response);
}
