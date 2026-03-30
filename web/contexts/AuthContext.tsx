// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useTransition } from "react";
import type { User } from "@/actions/auth";

type AuthContextType = {
  user: User | null;
  logout: () => void;
  isPending: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialUser,
  logoutAction,
}: {
  children: React.ReactNode;
  initialUser: User | null;
  logoutAction: () => Promise<void>;
}) {
  const [user] = useState<User | null>(initialUser);
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(() => logoutAction());
  }

  return (
    <AuthContext.Provider value={{ user, logout, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}