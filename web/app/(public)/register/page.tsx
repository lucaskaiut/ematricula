import { registerAction, RegisterActionResult } from "@/app/actions/auth";
import { Register } from "@/components/Register";
import { RegisterRequestBody } from "@/types/api";

export default async function RegisterPage() {
  const handleRegister = async (data: RegisterRequestBody): Promise<RegisterActionResult> => {
    "use server";
    return await registerAction(data);
  }

  return (
    <Register handleRegister={handleRegister} />
  );
}
