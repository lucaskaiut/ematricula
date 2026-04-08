import { Api } from "@/lib/api";
import type { RoleAttributes } from "@/types/api";

import { UserForm } from "../_components/user-form";

export default async function NewUserPage() {
  let defaultRoleId = 0;
  try {
    const api = new Api("/roles");
    const res = await api.get<RoleAttributes[]>({ per_page: 100 });
    const rows = res.data;
    if (Array.isArray(rows) && rows.length > 0) {
      defaultRoleId = rows[0].id;
    }
  } catch {
    //
  }

  return (
    <UserForm
      mode="create"
      defaultValues={{
        name: "",
        email: "",
        password: "",
        role_id: defaultRoleId,
      }}
    />
  );
}
