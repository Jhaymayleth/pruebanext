import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DeactivationOutcome =
  | "not-found"
  | "already-inactive"
  | "has-active-reservations"
  | "deactivated";

export async function DELETE(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  const session = await verifyAccessToken(accessToken);

  if (!session) {
    return NextResponse.json(
      { error: "La sesión no es válida o ha expirado." },
      { status: 401 },
    );
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para gestionar espacios." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Identificador de espacio inválido." },
      { status: 400 },
    );
  }

  try {
    const outcome = await prisma.$transaction(
      async (tx): Promise<DeactivationOutcome> => {
        await tx.$queryRaw`
          SELECT id
          FROM "Space"
          WHERE id = ${id}::uuid
          FOR UPDATE
        `;

        const space = await tx.space.findUnique({
          where: { id },
          select: { id: true, isActive: true },
        });

        if (!space) {
          return "not-found";
        }

        if (!space.isActive) {
          return "already-inactive";
        }

        const blockingReservations = await tx.reservation.count({
          where: {
            spaceId: id,
            status: ReservationStatus.CONFIRMED,
            endAt: { gt: new Date() },
          },
        });

        if (blockingReservations > 0) {
          return "has-active-reservations";
        }

        await tx.space.update({
          where: { id },
          data: { isActive: false },
        });

        return "deactivated";
      },
    );

    switch (outcome) {
      case "not-found":
        return NextResponse.json(
          { error: "No se encontró el espacio." },
          { status: 404 },
        );

      case "has-active-reservations":
        return NextResponse.json(
          {
            error:
              "No se puede desactivar un espacio con reservas futuras confirmadas.",
          },
          { status: 409 },
        );

      case "already-inactive":
        return NextResponse.json({
          message: "El espacio ya estaba desactivado.",
        });

      case "deactivated":
        return NextResponse.json({
          message: "Espacio desactivado correctamente.",
        });
    }
  } catch (error) {
    console.error("Error al desactivar espacio:", error);

    return NextResponse.json(
      { error: "No se pudo desactivar el espacio." },
      { status: 500 },
    );
  }
}
