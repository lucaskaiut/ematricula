"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";

export function HeaderUserAvatar() {
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/user/me", { method: "PATCH", body: fd });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={onFileChange}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-muted-foreground shadow-input transition-opacity",
          busy && "opacity-60",
        )}
        aria-label="Alterar foto de perfil"
        title="Alterar foto de perfil"
      >
        {user?.avatar_url ? (
          <span
            className="block h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${user.avatar_url})` }}
            role="img"
            aria-hidden
          />
        ) : (
          <User className="h-4 w-4" />
        )}
      </button>
    </>
  );
}
