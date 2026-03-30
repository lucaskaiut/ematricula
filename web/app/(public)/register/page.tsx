import { registerAction, RegisterRequest, RegisterResponse } from "@/actions/auth";
import { Register } from "@/components/Register";

export default async function RegisterPage() {
  async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
    "use server";
    const response = await registerAction(data);
    return response;
  }
  return (
    <Register onSubmit={registerUser} />
  );
}
