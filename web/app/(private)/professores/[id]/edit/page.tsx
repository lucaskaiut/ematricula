import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import type { PersonAttributes } from '@/types/api';

import { PersonForm } from '../../../_persons/person-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProfessorPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !/^\d+$/.test(id)) notFound();

  let person: PersonAttributes;
  try {
    const api = new Api(`/persons/${id}`);
    const response = await api.get<PersonAttributes>();
    const data = response.data;
    if (!data) notFound();
    person = data;
  } catch {
    notFound();
  }

  if (person.profile !== 'teacher') notFound();

  return (
    <PersonForm
      mode="edit"
      profile="teacher"
      listPath="/professores"
      personId={person.id}
      labels={{
        segment: 'Professores',
        newTitle: 'Novo professor',
        editTitle: 'Editar professor',
        subtitleCreate: 'Cadastre um professor vinculado à sua empresa.',
        subtitleEdit: 'Atualize os dados do professor.',
      }}
      defaultValues={{
        full_name: person.full_name,
        birth_date: person.birth_date?.slice(0, 10) ?? '',
        cpf: person.cpf ?? '',
        phone: person.phone,
        email: person.email,
        guardian_person_id: '',
        status: person.status,
        notes: person.notes ?? '',
      }}
    />
  );
}
