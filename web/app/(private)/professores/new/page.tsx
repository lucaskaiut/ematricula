import { PersonForm } from '../../_persons/person-form';

export default function NovoProfessorPage() {
  return (
    <PersonForm
      mode="create"
      profile="teacher"
      listPath="/professores"
      labels={{
        segment: 'Professores',
        newTitle: 'Novo professor',
        editTitle: 'Editar professor',
        subtitleCreate: 'Cadastre um professor vinculado à sua empresa.',
        subtitleEdit: 'Atualize os dados do professor.',
      }}
      defaultValues={{
        full_name: '',
        birth_date: '',
        cpf: '',
        phone: '',
        email: '',
        guardian_person_id: '',
        status: 'active',
        notes: '',
      }}
    />
  );
}
