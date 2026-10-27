
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authCookieOptions,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from "@/lib/auth";

export const runtime = "nodejs";

function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", {
    ...authCookieOptions,
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    ...authCookieOptions,
    maxAge: 0,
  });

  return response;
}

export async function POST(request: Request) {
  const rawRefreshToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("refresh_token="))
    ?.slice("refresh_token=".length);

  if (!rawRefreshToken) {
    return clearAuthCookies(
      NextResponse.json(
        { error: "La sesión ha expirado" },
        { status: 401 },
      ),
    );
  }

  let refreshToken: string;

  try {
    refreshToken = decodeURIComponent(rawRefreshToken);
  } catch {
    return clearAuthCookies(
      NextResponse.json(
        { error: "Token no válido" },
        { status: 401 },
      ),
    );
  }

  try {
    const tokenHash = hashRefreshToken(refreshToken);
    const newRefreshToken = createRefreshToken();
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (
        !storedToken ||
        storedToken.revokedAt !== null ||
        storedToken.expiresAt <= now
      ) {
        return null;
      }

      // Revocación atómica: evita reutilizar el mismo token.
      const revoked = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) {
        return null;
      }

      await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: hashRefreshToken(newRefreshToken),
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      return {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: storedToken.user.role,
      };
    });

    if (!user) {
      return clearAuthCookies(
        NextResponse.json(
          { error: "La sesión ha expirado. Inicia sesión nuevamente." },
          { status: 401 },
        ),
      );
    }

    const accessToken = await createAccessToken({
      id: user.id,
      role: user.role,
    });

    const response = NextResponse.json({ user });

    response.cookies.set("access_token", accessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60,
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    console.error("Error durante la renovación de sesión");

    return NextResponse.json(
      { error: "No se pudo renovar la sesión" },
      { status: 500 },
    );
  }
}
