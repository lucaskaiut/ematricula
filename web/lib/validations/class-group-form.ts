import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 caracteres')
  .max(255, 'Máximo de 255 caracteres');

const weekdaysSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'Selecione pelo menos um dia da semana');

const timeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/, 'Use um horário válido (HH:mm)');

export const classGroupFormValuesSchema = z
  .object({
    name: nameSchema,
    modality_id: z.coerce
      .number({ error: 'Selecione a modalidade' })
      .int()
      .refine((n) => n > 0, 'Selecione a modalidade'),
    teacher_person_id: z.coerce
      .number({ error: 'Selecione o professor' })
      .int()
      .refine((n) => n > 0, 'Selecione o professor'),
    max_capacity: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? null : v),
      z.union([z.null(), z.coerce.number().int().min(1, 'Mínimo 1')]),
    ),
    weekdays: weekdaysSchema,
    starts_at: timeSchema,
    ends_at: timeSchema,
    plan_ids: z.array(z.number().int().positive()),
  })
  .superRefine((data, ctx) => {
    if (data.ends_at <= data.starts_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O horário de fim deve ser posterior ao de início.',
        path: ['ends_at'],
      });
    }
  });

export type ClassGroupFormValues = z.infer<typeof classGroupFormValuesSchema>;

export type ClassGroupFormMode = 'create' | 'edit';

export function parseClassGroupFormForServer(input: ClassGroupFormValues) {
  return classGroupFormValuesSchema.safeParse(input);
}
