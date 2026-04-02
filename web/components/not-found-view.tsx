import Link from 'next/link';

export type NotFoundViewProps = {
  title?: string;
  description?: string;
  primaryAction?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  className?: string;
};

const defaultTitle = 'Página não encontrada';
const defaultDescription =
  'O conteúdo que você procura não existe, foi removido ou o endereço está incorreto.';

function NotFoundIllustration() {
  return (
    <div
      className="relative mx-auto mb-8 w-full max-w-[min(100%,280px)]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 240 200"
        className="h-auto w-full text-slate-200/90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nf-shade" x1="40" y1="24" x2="200" y2="176" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--ematricula-brand-gradient-mid, #3c5bb9)" stopOpacity="0.12" />
            <stop offset="1" stopColor="var(--ematricula-brand-gradient-end, #4b5c92)" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="nf-accent" x1="120" y1="60" x2="200" y2="140" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--ematricula-link, #1e429f)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--ematricula-link-bright, #1d4ed8)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <rect x="8" y="16" width="224" height="168" rx="20" fill="url(#nf-shade)" />
        <rect
          x="24"
          y="32"
          width="192"
          height="136"
          rx="14"
          className="stroke-slate-300/80"
          strokeWidth="1.5"
          fill="var(--ematricula-surface, #ffffff)"
        />
        <circle cx="44" cy="48" r="4" className="fill-slate-300" />
        <circle cx="58" cy="48" r="4" className="fill-slate-300" />
        <circle cx="72" cy="48" r="4" className="fill-slate-300" />
        <path
          d="M40 72h160M40 92h120M40 112h140M40 132h90"
          className="stroke-slate-200"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="168" cy="118" r="36" stroke="url(#nf-accent)" strokeWidth="2.5" fill="none" />
        <path
          d="M194 144l22 22"
          className="stroke-[var(--ematricula-link,#1e429f)]"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M156 110c4-8 14-12 24-8s14 16 8 24-18 10-28 4"
          className="stroke-slate-400"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function NotFoundView({
  title = defaultTitle,
  description = defaultDescription,
  primaryAction = { href: '/', label: 'Ir ao início' },
  secondaryAction,
  className,
}: NotFoundViewProps) {
  return (
    <div
      className={
        className ??
        'flex min-h-[min(70dvh,520px)] w-full flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16'
      }
    >
      <div className="w-full max-w-md text-center">
        <NotFoundIllustration />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ematricula-text-muted">
          Erro 404
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ematricula-text-primary sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-ematricula-text-secondary sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--ematricula-radius-control)] px-5 text-sm font-medium text-ematricula-text-secondary ring-1 ring-slate-200/90 transition-colors hover:bg-slate-50"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
          <Link
            href={primaryAction.href}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--ematricula-radius-control)] bg-gradient-to-br from-[var(--ematricula-cta-gradient-from)] to-[var(--ematricula-cta-gradient-to)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-ematricula-cta)] transition-opacity hover:opacity-95"
          >
            {primaryAction.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
