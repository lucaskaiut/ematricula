import { AuthedShell } from "@/components/sidebar/authed-shell";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthedShell>
      {children}
    </AuthedShell>
  );
}
