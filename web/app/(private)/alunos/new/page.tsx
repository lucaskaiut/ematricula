import { PersonForm } from '../../_persons/person-form';

export default function NovoAlunoPage() {
  return (
    <PersonForm
      mode="create"
      profile="student"
      listPath="/alunos"
      labels={{
        segment: 'Alunos',
        newTitle: 'Novo aluno',
        editTitle: 'Editar aluno',
        subtitleCreate: 'Cadastre um aluno. Menores de idade exigem um responsável cadastrado.',
        subtitleEdit: 'Atualize os dados do aluno.',
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
        modality_ids: [],
      }}
    />
  );
}
