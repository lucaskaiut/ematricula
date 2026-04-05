import { z } from 'zod';

import type { EnrollmentStatus } from '@/types/api';

const ymd = /^\d{4}-\d{2}-\d{2}$/;

const enrollmentCoreSchema = z.object({
  student_person_id: z.coerce
    .number({ error: 'Selecione o aluno' })
    .int()
    .refine((n) => n > 0, 'Selecione o aluno'),
  class_group_id: z.coerce
    .number({ error: 'Selecione a turma' })
    .int()
    .refine((n) => n > 0, 'Selecione a turma'),
  starts_on: z
    .string()
    .trim()
    .regex(ymd, 'Use a data no formato AAAA-MM-DD'),
  ends_on: z.preprocess(
    (v) => (v === null || v === undefined || v === '' ? null : v),
    z.union([
      z.null(),
      z.string().trim().regex(ymd, 'Use a data no formato AAAA-MM-DD'),
    ]),
  ),
  status: z.enum(['active', 'locked', 'cancelled'], {
    message: 'Selecione o status',
  }),
});

function withEndsAfterStarts<S extends z.ZodTypeAny>(schema: S) {
  return schema.superRefine((data, ctx) => {
    const d = data as { ends_on: string | null; starts_on: string };
    if (d.ends_on !== null && d.ends_on < d.starts_on) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data de término deve ser igual ou posterior à de início',
        path: ['ends_on'],
      });
    }
  });
}

const enrollmentCreateSchema = withEndsAfterStarts(
  enrollmentCoreSchema.extend({
    plan_id: z.coerce.number().int().positive('Selecione o plano'),
    billing_starts_on: z
      .string()
      .trim()
      .regex(ymd, 'Use a data no formato AAAA-MM-DD'),
  }),
);

const enrollmentEditSchema = withEndsAfterStarts(
  enrollmentCoreSchema.extend({
    plan_id: z.coerce.number().int().min(0),
    billing_starts_on: z
      .string()
      .trim()
      .refine((s) => s === '' || ymd.test(s), 'Use a data no formato AAAA-MM-DD'),
  }),
);

export type EnrollmentFormValues = z.infer<typeof enrollmentCreateSchema>;

export type EnrollmentFormMode = 'create' | 'edit';

export function buildEnrollmentFormSchema(
  mode: EnrollmentFormMode,
  initialStatusWhenLoaded?: EnrollmentStatus,
) {
  const base = mode === 'create' ? enrollmentCreateSchema : enrollmentEditSchema;

  if (initialStatusWhenLoaded !== 'cancelled') {
    return base;
  }

  return base.superRefine((data, ctx) => {
    if (data.status !== 'cancelled') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não é possível reativar uma matrícula cancelada.',
        path: ['status'],
      });
    }
  });
}

export function parseEnrollmentFormForServer(
  input: EnrollmentFormValues,
  options: { mode: EnrollmentFormMode; initialStatusWhenLoaded?: EnrollmentStatus },
) {
  return buildEnrollmentFormSchema(options.mode, options.initialStatusWhenLoaded).safeParse(
    input,
  );
}
