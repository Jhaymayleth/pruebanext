"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/hooks/use-session";

type RegisterResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  error?: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/spaces");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("La contraseña debe tener entre 8 y 72 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      let result: RegisterResponse;

      try {
        result = (await response.json()) as RegisterResponse;
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida.");
      }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo crear la cuenta.");
      }

      if (!result.user) {
        throw new Error(
          "La cuenta pudo crearse, pero no se recibió la información del usuario.",
        );
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
      <SiteHeader />

      <section className="mx-auto grid w-full max-w-[1240px] flex-1 grid-cols-12 items-center gap-4 px-5 py-14">
        <Reveal delay={140} className="col-span-12 order-2 lg:order-1 lg:col-span-7">
          <Card className="mx-auto w-full max-w-xl border-line bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-4xl font-black tracking-tight">
                Crear cuenta
              </CardTitle>
              <CardDescription>
                Regístrate en CoSpace para reservar tus espacios de trabajo.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={80}
                    placeholder="Ana Torres"
                    required
                    disabled={loading}
                  />
                </div>

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
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={72}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    maxLength={72}
                    placeholder="Repite la contraseña"
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
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                    Inicia sesión
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </Reveal>

        <Reveal className="col-span-12 order-1 lg:order-2 lg:col-span-5">
          <div className="bento-cell accent h-full">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#4c5a2e]">
              Empieza en un minuto
            </p>
            <h1 className="mt-6 font-heading text-[clamp(2.4rem,5vw,4rem)] font-black leading-[0.95] tracking-tight text-[#242a23]">
              Tu mesa te está esperando.
            </h1>
            <ul className="mt-7 grid gap-3 text-sm text-[#3c4530]">
              {[
                "Registro con correo y contraseña",
                "Catálogo público con precio por hora",
                "Reservas de 1 a 4 horas en horario corrido",
                "Cancelación hasta 2 horas antes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[#242a23]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </main>
  );
}