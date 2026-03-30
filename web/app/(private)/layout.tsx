import { getUser, logoutAction } from "@/actions/auth";
import { AuthedShell } from "@/components/sidebar/authed-shell";
import { AuthProvider } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AuthProvider initialUser={user} logoutAction={logoutAction}>
      <AuthedShell>{children}</AuthedShell>
    </AuthProvider>
  );
}
