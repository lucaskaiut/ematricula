import { notFound } from "next/navigation";

import { Api } from "@/lib/api";
import type { RoleAttributes } from "@/types/api";

import { RoleForm } from "../../_components/role-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRolePage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let role: RoleAttributes;
  try {
    const api = new Api(`/roles/${id}`);
    const response = await api.get<RoleAttributes>();
    const data = response.data;
    if (!data) notFound();
    role = data;
  } catch {
    notFound();
  }

  return (
    <RoleForm
      mode="edit"
      roleId={role.id}
      defaultValues={{
        name: role.name,
        description: role.description ?? "",
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
      }}
    />
  );
}
