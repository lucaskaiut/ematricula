import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = await getServerSession();
  if (!token || !user) {
    redirect("/sign-in");
  }
  return children;
}
