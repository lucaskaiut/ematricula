import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 caracteres')
  .max(255, 'Máximo de 255 caracteres');

const descriptionSchema = z
  .string()
  .max(10000, 'Máximo de 10.000 caracteres')
  .optional()
  .transform((v) => (v === undefined ? '' : v));

export const modalityFormValuesSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
});

export type ModalityFormValues = z.infer<typeof modalityFormValuesSchema>;

export type ModalityFormMode = 'create' | 'edit';

export function parseModalityFormForServer(input: ModalityFormValues) {
  return modalityFormValuesSchema.safeParse(input);
}
