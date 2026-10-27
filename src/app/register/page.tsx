
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

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
        throw new Error(
          result.error ?? "No se pudo crear la cuenta.",
        );
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
    <main>
      <h1>Crear cuenta</h1>
      <p>Regístrate en CoSpace para reservar tus espacios de trabajo.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nombre completo</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            required
            disabled={loading}
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={loading}
          />
          <p>Debe tener entre 8 y 72 caracteres.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
            disabled={loading}
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p>
        ¿Ya tienes una cuenta?{" "}
        <a href="/login">Inicia sesión</a>
      </p>
    </main>
  );
}
