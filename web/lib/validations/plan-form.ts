import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 caracteres')
  .max(255, 'Máximo de 255 caracteres');

export const planFormValuesSchema = z.object({
  name: nameSchema,
  price: z.coerce
    .number({ error: 'Informe o valor' })
    .min(0, 'Não pode ser negativo')
    .max(99_999_999.99, 'Valor muito alto'),
  billing_cycle: z.enum(['month', 'year'], { message: 'Selecione o ciclo' }),
  billing_interval: z.coerce
    .number({ error: 'Informe o intervalo' })
    .int()
    .min(1, 'Mínimo 1'),
});

export type PlanFormValues = z.infer<typeof planFormValuesSchema>;

export type PlanFormMode = 'create' | 'edit';

export function parsePlanFormForServer(input: PlanFormValues) {
  return planFormValuesSchema.safeParse(input);
}
