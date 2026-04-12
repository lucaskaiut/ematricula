import { registerAction, RegisterResponse } from "@/actions/auth";
import { Register } from "@/components/Register";

export default async function RegisterPage() {
  async function registerUser(formData: FormData): Promise<RegisterResponse> {
    "use server";
    return registerAction(formData);
  }
  return (
    <Register onSubmit={registerUser} />
  );
}
