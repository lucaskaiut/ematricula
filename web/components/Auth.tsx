"use client";

import { LoginActionResult } from "@/app/actions/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bounce, ToastContainer, toast } from "react-toastify";

export function Auth({
  handleLogin,
}: {
  handleLogin: (email: string, password: string) => Promise<LoginActionResult>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsLoading(true);
    const response = await handleLogin(email, password);

    if (!response.ok) {
      toast.error("Há um problema com suas credenciais.", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
      setIsLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-dvh w-full justify-center bg-ematricula-page-bg px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-24 md:pb-[54px] md:pt-[102px]">
      <section
        className="flex w-full min-w-0 max-w-[500px] overflow-hidden rounded-ematricula-card bg-ematricula-card-shell shadow-ematricula-card"
        aria-label="Tela de login"
      >
        <div className="flex w-full min-w-0 flex-col justify-center bg-ematricula-surface p-5 sm:p-8 md:p-16">
          <header className="pb-6 md:pb-10">
            <h2 className="font-display text-[1.375rem] font-bold leading-7 text-ematricula-text-primary sm:text-2xl sm:leading-8">
              Bem-vindo(a) de volta
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-5 text-ematricula-text-secondary">
              Informe suas credenciais para acessar o sistema.
            </p>
          </header>

          <div className="flex flex-col gap-4 pb-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold leading-5 text-ematricula-text-primary">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                placeholder="nome@instituicao.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-ematricula-control bg-ematricula-surface px-4 py-3 text-base leading-snug text-ematricula-text-primary shadow-ematricula-input placeholder:text-ematricula-text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <label className="text-[14px] font-semibold leading-5 text-ematricula-text-primary">
                  Senha
                </label>
                <button
                  type="button"
                  className="shrink-0 text-left text-[12px] font-bold leading-4 text-ematricula-link sm:text-right"
                  aria-disabled="true"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-ematricula-control bg-ematricula-surface px-4 py-3 text-base leading-snug text-ematricula-text-primary shadow-ematricula-input placeholder:text-ematricula-text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:gap-6 sm:pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                aria-disabled={isLoading}
                className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[24px] px-4 py-3.5 shadow-ematricula-cta sm:min-h-0 sm:py-4"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--ematricula-cta-gradient-from) 0%, var(--ematricula-cta-gradient-to) 100%)",
                }}
              >
                <span className="text-base font-bold leading-7 text-ematricula-text-on-brand sm:text-[18px]">
                  {isLoading ? "Entrando..." : "Entrar"}
                </span>
              </button>

              <div className="relative flex w-full justify-center py-2">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ematricula-border-input" />
                <span className="relative max-w-[90%] bg-ematricula-surface px-2 text-center text-[12px] font-medium leading-4 text-ematricula-text-muted">
                  Novo no sistema?
                </span>
              </div>

              <button
                type="button"
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[24px] bg-ematricula-signup-pill-bg px-3 py-3.5 sm:min-h-0 sm:py-4"
                onClick={() => router.push("/register")}
              >
                <span className="text-center text-sm font-bold leading-6 text-ematricula-link sm:text-[16px]">
                  Não tem uma conta? Cadastre-se
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <ToastContainer />
    </main>
  );
}
