import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 caracteres')
  .max(120, 'Máximo de 120 caracteres');

const emailSchema = z.string().trim().email('E-mail inválido').max(255, 'E-mail muito longo');

const passwordStrong = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa');

export const userFormValuesSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string(),
});

export type UserFormValues = z.infer<typeof userFormValuesSchema>;

export function userFormSchemaCreate() {
  return userFormValuesSchema.extend({
    password: passwordStrong,
  });
}

export function userFormSchemaEdit() {
  return userFormValuesSchema.extend({
    password: z
      .string()
      .max(128, 'Senha muito longa')
      .refine((v) => v === '' || v.length >= 8, {
        message: 'Se informar senha, use pelo menos 8 caracteres',
      }),
  });
}

export type UserFormMode = 'create' | 'edit';

export function parseUserFormForServer(input: UserFormValues, mode: UserFormMode) {
  const schema = mode === 'create' ? userFormSchemaCreate() : userFormSchemaEdit();
  return schema.safeParse(input);
}
