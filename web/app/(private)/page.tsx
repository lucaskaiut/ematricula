export default async function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Início
      </h1>
      <p className="max-w-prose text-sm text-secondary">
        Bem-vindo ao eMatrícula. Use o menu para acessar alunos, professores,
        modalidades e usuários.
      </p>
    </div>
  );
}
