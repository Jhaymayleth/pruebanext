
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authCookieOptions,
  hashRefreshToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const refreshToken = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith("refresh_token="))
    ?.slice("refresh_token=".length);

  if (refreshToken) {
    try {
      await prisma.refreshToken.updateMany({
        where: {
          tokenHash: hashRefreshToken(
            decodeURIComponent(refreshToken),
          ),
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      console.error("No se pudo revocar el refresh token");
    }
  }

  const response = NextResponse.json({ message: "Sesión cerrada" });

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
