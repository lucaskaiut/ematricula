import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import type { UserAttributes } from '@/types/api';

import { UserForm } from '../../_components/user-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let user: UserAttributes;
  try {
    const api = new Api(`/users/${id}`);
    const response = await api.get<UserAttributes>();
    const data = response.data;
    if (!data) notFound();
    user = data;
  } catch {
    notFound();
  }

  return (
    <UserForm
      mode="edit"
      userId={user.id}
      defaultValues={{
        name: user.name,
        email: user.email,
        password: "",
        role_id: user.role?.id ?? 0,
      }}
    />
  );
}
