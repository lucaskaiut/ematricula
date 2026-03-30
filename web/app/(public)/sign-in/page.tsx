import { Auth } from "@/components/Auth";
import { loginAction, LoginRequest, LoginResponse } from "@/actions/auth";

export default async function SignInPage() {
  async function onSubmit(data: LoginRequest): Promise<LoginResponse> {
    "use server";
    const response = await loginAction(data);
    return response;
  }

  return <Auth onSubmit={onSubmit} />;
}
