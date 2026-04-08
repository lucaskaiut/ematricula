import { HomeCalendarDashboard } from "@/components/home/home-calendar-dashboard";
import { HomeFinanceDashboard } from "@/components/home/home-finance-dashboard";

export default async function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Início
      </h1>
      <p className="max-w-prose text-sm text-secondary">
        Bem-vindo ao eMatrícula. Abaixo está a visão geral das aulas por turma;
        use o menu para alunos, professores, modalidades e demais cadastros.
      </p>
      <HomeFinanceDashboard />
      <HomeCalendarDashboard />
    </div>
  );
}
