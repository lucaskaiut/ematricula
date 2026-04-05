import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import { apiPriceToNumber } from '@/lib/currency-brl';
import type { PlanAttributes } from '@/types/api';

import { PlanForm } from '../../_components/plan-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPlanoPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let plan: PlanAttributes;
  try {
    const api = new Api(`/plans/${id}`);
    const response = await api.get<PlanAttributes>();
    const data = response.data;
    if (!data) notFound();
    plan = data;
  } catch {
    notFound();
  }

  return (
    <PlanForm
      mode="edit"
      planId={plan.id}
      defaultValues={{
        name: plan.name,
        price: apiPriceToNumber(plan.price) ?? 0,
        billing_cycle: plan.billing_cycle,
        billing_interval: plan.billing_interval,
      }}
    />
  );
}
