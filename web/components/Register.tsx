"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bounce, ToastContainer, toast } from "react-toastify";
import { ThemeToggle } from "@/components/theme-toggle";
import type { RegisterRequestBody } from "@/types/api";
import type { RegisterResponse } from "@/actions/auth";

export function Register({
  onSubmit,
}: {
  onSubmit: (formData: FormData) => Promise<RegisterResponse>;
}) {
  const [data, setData] = useState<RegisterRequestBody>({
    company: {
      name: "",
      email: "",
      phone: "",
    },
    user: {
      name: "",
      email: "",
      password: "",
    },
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setIsLoading(true);

    const formData = new FormData();
    formData.append("company[name]", data.company.name);
    formData.append("company[email]", data.company.email);
    formData.append("company[phone]", data.company.phone);
    formData.append("user[name]", data.user.name);
    formData.append("user[email]", data.user.email);
    formData.append("user[password]", data.user.password);
    if (avatarFile) {
      formData.append("user[avatar]", avatarFile);
    }

    const response = await onSubmit(formData);

    if (response.success) {
      toast.success("Usuário cadastrado com sucesso");
      router.push("/sign-in");
      return;
    }

    toast.error("Erro ao cadastrar usuário");

    setIsLoading(false);
  }

  return (
    <main className="relative flex min-h-dvh w-full justify-center bg-background px-4 pb-8 pt-16 sm:px-6 sm:pb-12 sm:pt-24 md:pb-[54px] md:pt-[102px]">
      <ThemeToggle className="absolute right-4 top-4 z-50 sm:right-6 sm:top-6" />
      <section
        className="flex w-full min-w-0 max-w-[560px] overflow-hidden rounded-card bg-card-subtle shadow-card"
        aria-label="Tela de cadastro"
      >
        <div className="flex w-full min-w-0 flex-col justify-center bg-card p-5 sm:p-8 md:p-16">
          <header className="pb-6 md:pb-10">
            <h2 className="font-display text-[1.375rem] font-bold leading-7 text-foreground sm:text-2xl sm:leading-8">
              Criar conta
            </h2>
            <p className="mt-2 text-[14px] font-medium leading-5 text-secondary">
              Preencha os dados da empresa e do usuário responsável para
              começar.
            </p>
          </header>

          <form
            className="pb-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6 sm:gap-8">
              <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 sm:gap-6">
                <legend className="mb-0 w-full min-w-0 border-b border-border pb-2 text-[14px] font-bold leading-5 text-foreground">
                  Dados da empresa
                </legend>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-company-name"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    Nome da escola
                  </label>
                  <input
                    id="register-company-name"
                    name="company.name"
                    type="text"
                    placeholder="Instituição ou razão social"
                    value={data.company.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company: { ...data.company, name: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="organization"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-company-email"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    E-mail da escola
                  </label>
                  <input
                    id="register-company-email"
                    name="company.email"
                    type="email"
                    placeholder="contato@instituicao.edu"
                    value={data.company.email}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company: { ...data.company, email: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="organization-email"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-company-phone"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    Telefone
                  </label>
                  <input
                    id="register-company-phone"
                    name="company.phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={data.company.phone}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company: { ...data.company, phone: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="tel"
                  />
                </div>
              </fieldset>

              <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0 sm:gap-6">
                <legend className="mb-0 w-full min-w-0 border-b border-border pb-2 text-[14px] font-bold leading-5 text-foreground">
                  Dados do usuário
                </legend>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-user-name"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    Nome completo
                  </label>
                  <input
                    id="register-user-name"
                    name="user.name"
                    type="text"
                    placeholder="Seu nome"
                    value={data.user.name}
                    onChange={(e) =>
                      setData({
                        ...data,
                        user: { ...data.user, name: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="name"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-user-email"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    E-mail
                  </label>
                  <input
                    id="register-user-email"
                    name="user.email"
                    type="email"
                    placeholder="nome@instituicao.edu"
                    value={data.user.email}
                    onChange={(e) =>
                      setData({
                        ...data,
                        user: { ...data.user, email: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-user-password"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    Senha
                  </label>
                  <input
                    id="register-user-password"
                    name="user.password"
                    type="password"
                    placeholder="••••••••"
                    value={data.user.password}
                    onChange={(e) =>
                      setData({
                        ...data,
                        user: { ...data.user, password: e.target.value },
                      })
                    }
                    className="min-h-11 w-full min-w-0 rounded-control bg-card px-4 py-3 text-base leading-snug text-foreground shadow-input placeholder:text-placeholder focus:outline-none sm:min-h-0 sm:py-[18px] sm:text-[16px] sm:leading-[19.36px]"
                    autoComplete="new-password"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="register-user-avatar"
                    className="text-[14px] font-semibold leading-5 text-foreground"
                  >
                    Foto de perfil
                  </label>
                  <input
                    id="register-user-avatar"
                    name="user.avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setAvatarFile(e.target.files?.[0] ?? null)
                    }
                    className="min-h-11 w-full min-w-0 rounded-control border-0 bg-card px-2 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                  />
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col gap-4 pt-6 sm:gap-6 sm:pt-8">
              <button
                type="submit"
                disabled={isLoading}
                aria-disabled={isLoading}
                className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[24px] px-4 py-3.5 shadow-cta disabled:opacity-60 sm:min-h-0 sm:py-4"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--primary) 0%, var(--primary-end) 100%)",
                }}
              >
                <span className="text-base font-bold leading-7 text-primary-foreground sm:text-[18px]">
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </span>
              </button>

              <div className="relative flex w-full justify-center py-2">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                <span className="relative max-w-[90%] bg-card px-2 text-center text-[12px] font-medium leading-4 text-muted">
                  Já possui acesso?
                </span>
              </div>

              <button
                type="button"
                className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-[24px] bg-accent-soft px-3 py-3.5 sm:min-h-0 sm:py-4"
                onClick={() => router.push("/sign-in")}
              >
                <span className="text-center text-sm font-bold leading-6 text-primary sm:text-[16px]">
                  Já tem uma conta? Faça login aqui
                </span>
              </button>
            </div>
          </form>
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
