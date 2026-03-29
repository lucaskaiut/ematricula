"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerAction, type RegisterActionResult } from "@/app/actions/auth";
import type { RegisterRequestBody } from "@/types/api";

export function useRegisterMutation() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: RegisterRequestBody) => registerAction(body),
    onSuccess: (result: RegisterActionResult) => {
      if (result.ok) {
        router.push("/sign-in?registered=1");
        router.refresh();
      }
    },
  });
}
