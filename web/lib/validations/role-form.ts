import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe pelo menos 2 caracteres")
  .max(120, "Máximo de 120 caracteres");

export const roleFormSchema = z.object({
  name: nameSchema,
  description: z
    .string()
    .trim()
    .max(500, "Máximo de 500 caracteres"),
  permissions: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

export function parseRoleFormForServer(input: RoleFormValues) {
  return roleFormSchema.safeParse(input);
}
