"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { LoginRequest, LoginResponse } from "@/actions/auth";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

export function Auth({
  onSubmit,
}: {
  onSubmit: (data: LoginRequest) => Promise<LoginResponse>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    const response = await onSubmit({ email, password });

    if (response.success) {
      toast.success("Login realizado com sucesso");
      redirect("/");
    }

    toast.error(response.error);

    setIsLoading(false);
  };

  return (
    <main className="relative flex min-h-dvh w-full justify-center bg-background px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-24 md:pb-[54px] md:pt-[102px]">
      <ThemeToggle className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6" />
      <section
        className="flex w-full min-w-0 max-w-[500px] overflow-hidden rounded-card bg-card-subtle shadow-card"
        aria-label="Tela de login"
      >
        <div className="flex w-full min-w-0 flex-col justify-center bg-card p-5 sm:p-8 md:p-16">
          <header className="pb-6 md:pb-10">
            <h2 className="font-display text-[1.375rem] font-bold leading-7 text-foreground sm:text-2xl sm:leading-8">
              Bem-vindo(a) de volta
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-5 text-secondary">
              Informe suas credenciais para acessar o sistema.
            </p>
          </header>

          <div className="flex flex-col gap-4 pb-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold leading-5 text-foreground">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                placeholder="nome@instituicao.edu"
                value={email}
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]",
                  isLoading && "opacity-50",
                )}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <label className="text-[14px] font-semibold leading-5 text-foreground">
                  Senha
                </label>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 text-left text-[12px] font-bold leading-4 text-primary sm:text-right",
                    isLoading && "opacity-50",
                  )}
                  disabled={isLoading}
                  aria-disabled={isLoading}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]",
                  isLoading && "opacity-50",
                )}
                autoComplete="current-password"
              />
            </div>

            <div className="flex flex-col gap-4 pt-2 sm:gap-6 sm:pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                aria-disabled={isLoading}
                className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[24px] px-4 py-3.5 shadow-cta sm:min-h-0 sm:py-4"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--primary) 0%, var(--primary-end) 100%)",
                }}
              >
                <span
                  className={cn(
                    "text-base font-bold leading-7 text-primary-foreground sm:text-[18px]",
                    isLoading && "opacity-50",
                  )}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </span>
              </button>

              <div className="relative flex w-full justify-center py-2">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                <span className="relative max-w-[90%] bg-card px-2 text-center text-[12px] font-medium leading-4 text-muted">
                  Novo no sistema?
                </span>
              </div>

              <button
                type="button"
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[24px] bg-accent-soft px-3 py-3.5 sm:min-h-0 sm:py-4"
                onClick={() => redirect("/register")}
                disabled={isLoading}
                aria-disabled={isLoading}
              >
                <span
                  className={cn(
                    "text-center text-sm font-bold leading-6 text-primary sm:text-[16px]",
                    isLoading && "opacity-50",
                  )}
                >
                  Não tem uma conta? Cadastre-se
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
    </main>
  );
}
