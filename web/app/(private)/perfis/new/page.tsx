import { RoleForm } from "../_components/role-form";

export default function NewRolePage() {
  return (
    <RoleForm
      mode="create"
      defaultValues={{ name: "", description: "", permissions: [] }}
    />
  );
}
