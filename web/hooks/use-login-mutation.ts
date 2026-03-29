"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { loginAction, type LoginActionResult } from "@/app/actions/auth";
import type { LoginRequestBody } from "@/types/api";

export function useLoginMutation() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: LoginRequestBody) => loginAction(body),
    onSuccess: (result: LoginActionResult) => {
      if (result.ok) {
        router.push("/");
        router.refresh();
      }
    },
  });
}
