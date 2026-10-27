
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authCookieOptions,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "@/lib/auth";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es válido" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nombre, correo o contraseña no válidos" },
      { status: 400 },
    );
  }

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const refreshToken = createRefreshToken();

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "USER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await tx.refreshToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      return createdUser;
    });

    const accessToken = await createAccessToken({
      id: user.id,
      role: user.role,
    });

    const response = NextResponse.json(
      { user },
      { status: 201 },
    );

    response.cookies.set("access_token", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60,
    });

    response.cookies.set("refresh_token", refreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "No se pudo crear la cuenta con esos datos" },
        { status: 409 },
      );
    }

    console.error("Error durante el registro");

    return NextResponse.json(
      { error: "No se pudo completar el registro" },
      { status: 500 },
    );
  }
}
