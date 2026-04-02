import { PersonsListPage } from '../_persons/persons-list-page';

export default function AlunosPage() {
  return (
    <PersonsListPage
      profile="student"
      basePath="/alunos"
      title="Alunos"
      newHref="/alunos/new"
      searchPlaceholder="Pesquisar por nome…"
      enableGuardianFilter
    />
  );
}
