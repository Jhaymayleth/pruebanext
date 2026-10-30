"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export function SiteHeader() {
  const { status, user, logout } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-heading text-xl font-black tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-[10px_10px_10px_3px] bg-[#d9fa72] font-display text-sm text-[#242a23]">
            C
          </span>
          CoSpace
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link href="/spaces" className="transition hover:text-foreground">
            Espacios
          </Link>
          <Link href="/reservations" className="transition hover:text-foreground">
            Mis reservas
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {status === "loading" && (
            <span
              aria-hidden
              className="h-9 w-40 animate-pulse rounded-md bg-[#f2f2ee]"
            />
          )}

          {status === "anonymous" && (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Crear cuenta</Link>
              </Button>
            </>
          )}

          {status === "authenticated" && user && (
            <>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                {user.name.split(" ")[0]}
                {user.role === "ADMIN" && (
                  <Badge variant="secondary" className="font-display uppercase tracking-[0.16em]">
                    Admin
                  </Badge>
                )}
              </span>

              <Button variant="ghost" asChild>
                <Link href="/reservations">Mis reservas</Link>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  void logout();
                }}
              >
                Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}