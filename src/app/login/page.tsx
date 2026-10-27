"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/reveal";

type LoginResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      let result: LoginResponse;

      try {
        result = (await response.json()) as LoginResponse;
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida.");
      }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo iniciar sesión.");
      }

      if (!result.user) {
        throw new Error("No se recibió la información del usuario.");
      }

      router.replace("/spaces");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-line">
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
          <Button variant="ghost" asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-12 items-center gap-4 px-5 py-14">
        <Reveal className="col-span-12 lg:col-span-5">
          <div className="bento-cell dark h-full">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#c1ce9c]">
              Bienvenido de nuevo
            </p>
            <h1 className="mt-6 font-heading text-[clamp(2.4rem,5vw,4rem)] font-black leading-[0.95] tracking-tight">
              Vuelve a tu mesa.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Inicia sesión para consultar tus reservas, cancelarlas hasta dos
              horas antes y reservar de nuevo.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { value: "15 min", label: "duración del access token" },
                { value: "7 días", label: "vigencia de la sesión" },
                { value: "httpOnly", label: "cookies de sesión" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <p className="font-display text-base text-[#d9fa72]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-white/55">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={140} className="col-span-12 lg:col-span-7">
          <Card className="mx-auto w-full max-w-xl border-line bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-4xl font-black tracking-tight">
                Iniciar sesión
              </CardTitle>
              <CardDescription>
                Accede a tu cuenta de CoSpace para gestionar tus reservas.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    maxLength={254}
                    placeholder="tu@correo.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    maxLength={72}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
              </CardContent>

              <CardFooter className="mt-2 flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  ¿Todavía no tienes cuenta?{" "}
                  <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
                    Crear una cuenta
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </Reveal>
      </section>
    </main>
  );
}