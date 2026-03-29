import { getServerSession } from "@/lib/auth/session";

export default async function HomePage() {
  const { user } = await getServerSession();

  return (
    <div className="min-h-screen bg-ematricula-page-bg px-6 py-16">
      <main className="mx-auto max-w-lg rounded-ematricula-card bg-ematricula-surface p-10 shadow-ematricula-card">
        <h1 className="font-display text-2xl font-bold text-ematricula-text-primary">
          Área privada
        </h1>
        <p className="mt-4 font-sans text-sm text-ematricula-text-secondary">
          Sessão iniciada como{" "}
          <span className="font-semibold text-ematricula-text-primary">{user?.name}</span> (
          {user?.email})
        </p>
      </main>
    </div>
  );
}
