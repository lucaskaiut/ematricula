import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { AuthedShell } from "@/components/sidebar/authed-shell";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AuthedShell user={user}>
      {children}
    </AuthedShell>
  );
}
