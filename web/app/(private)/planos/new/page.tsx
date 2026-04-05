import { PlanForm } from '../_components/plan-form';

export default function NovoPlanoPage() {
  return (
    <PlanForm
      mode="create"
      defaultValues={{
        name: '',
        price: 0,
        billing_cycle: 'month',
        billing_interval: 1,
      }}
    />
  );
}
