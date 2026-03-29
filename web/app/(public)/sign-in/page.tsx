import { loginAction, LoginActionResult } from "@/app/actions/auth";
import { Auth } from "@/components/Auth";

export default async function SignInPage() {
  const handleLogin = async (email: string, password: string): Promise<LoginActionResult> => {
    "use server";
    return await loginAction({ email, password });
  }

  return (
    <Auth handleLogin={handleLogin} />
  );
}
