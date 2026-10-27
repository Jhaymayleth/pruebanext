
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
        throw new Error(
          result.error ?? "No se pudo iniciar sesión.",
        );
      }

      if (!result.user) {
        throw new Error(
          "No se recibió la información del usuario.",
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
    <main>
      <h1>Iniciar sesión</h1>
      <p>Accede a tu cuenta de CoSpace para gestionar tus reservas.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={72}
            required
            disabled={loading}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      <p>
        ¿Todavía no tienes cuenta?{" "}
        <a href="/register">Crear una cuenta</a>
      </p>
    </main>
  );
}
