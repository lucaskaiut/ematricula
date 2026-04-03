import { PersonsListPage } from '../_persons/persons-list-page';

export default function ProfessoresPage() {
  return (
    <PersonsListPage
      profile="teacher"
      basePath="/professores"
      title="Professores"
      newHref="/professores/new"
      searchPlaceholder="Pesquisar por nome…"
      enableModalityFilter
    />
  );
}
