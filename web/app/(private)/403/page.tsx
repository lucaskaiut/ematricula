import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Acesso negado
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-secondary">
        Seu perfil não inclui permissão para esta área. Se precisar de acesso,
        peça a um administrador da empresa.
      </p>
      <Link
        href="/"
        className="rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-input transition-opacity hover:opacity-90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
