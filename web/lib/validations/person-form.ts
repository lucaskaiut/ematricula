import { z } from 'zod';

import { personIsMinorFromIsoDate } from '@/lib/person-age';
import type { PersonProfile, PersonStatus } from '@/types/api';

const fullNameSchema = z
  .string()
  .trim()
  .min(3, 'Informe o nome completo')
  .max(255, 'Máximo de 255 caracteres');

const emailSchema = z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo');

const cpfDigitsSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || v.length === 11, {
    message: 'CPF deve ter 11 dígitos',
  })
  .transform((v) => (v === '' ? '' : v));

const phoneDigitsSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length >= 10 && v.length <= 13, {
    message: 'Telefone inválido',
  });

const birthDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
  .refine((s) => {
    const d = new Date(`${s}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d < new Date();
  }, 'Data de nascimento inválida ou no futuro');

export const personFormValuesSchema = (profile: PersonProfile) =>
  z
    .object({
      full_name: fullNameSchema,
      birth_date: birthDateSchema,
      cpf: cpfDigitsSchema,
      phone: phoneDigitsSchema,
      email: emailSchema,
      guardian_person_id: z.string().default(''),
      status: z.enum(['active', 'inactive'] satisfies [PersonStatus, PersonStatus]),
      notes: z.string().max(10000).default(''),
      modality_ids: z.array(z.number().int().positive()).max(50).default([]),
    })
    .superRefine((data, ctx) => {
      if (profile === 'student' && data.modality_ids.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Modalidades não se aplicam a alunos.',
          path: ['modality_ids'],
        });
      }
      if (profile !== 'student') return;
      if (!personIsMinorFromIsoDate(data.birth_date)) return;
      const raw = data.guardian_person_id.trim();
      if (raw === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o responsável (menor de idade).',
          path: ['guardian_person_id'],
        });
      }
    });

export type PersonFormValues = {
  full_name: string;
  birth_date: string;
  cpf: string;
  phone: string;
  email: string;
  guardian_person_id: string;
  status: PersonStatus;
  notes: string;
  modality_ids: number[];
};

export type PersonFormMode = 'create' | 'edit';

export function parsePersonFormForServer(
  input: PersonFormValues,
  profile: PersonProfile,
) {
  return personFormValuesSchema(profile).safeParse(input);
}
