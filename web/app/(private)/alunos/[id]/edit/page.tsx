import { notFound } from 'next/navigation';

import { Api } from '@/lib/api';
import type { PersonAttributes } from '@/types/api';

import { PersonForm } from '../../../_persons/person-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAlunoPage({ params }: PageProps) {
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

  if (person.profile !== 'student') notFound();

  return (
    <PersonForm
      mode="edit"
      profile="student"
      listPath="/alunos"
      personId={person.id}
      labels={{
        segment: 'Alunos',
        newTitle: 'Novo aluno',
        editTitle: 'Editar aluno',
        subtitleCreate: 'Cadastre um aluno. Menores de idade exigem um responsável cadastrado.',
        subtitleEdit: 'Atualize os dados do aluno.',
      }}
      defaultValues={{
        full_name: person.full_name,
        birth_date: person.birth_date?.slice(0, 10) ?? '',
        cpf: person.cpf ?? '',
        phone: person.phone,
        email: person.email,
        guardian_person_id:
          person.guardian_person_id !== null ? String(person.guardian_person_id) : '',
        status: person.status,
        notes: person.notes ?? '',
        modality_ids: [],
      }}
    />
  );
}
