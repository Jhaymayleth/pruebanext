
import { NextResponse } from "next/server";
import { ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext,
) {
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

  const { id } = await context.params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return NextResponse.json(
      { error: "Identificador de reserva inválido." },
      { status: 400 },
    );
  }

  try {
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      select: {
        id: true,
        status: true,
        startAt: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "No se encontró la reserva." },
        { status: 404 },
      );
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      return NextResponse.json(
        { error: "La reserva ya está cancelada." },
        { status: 409 },
      );
    }

    if (reservation.startAt <= new Date()) {
      return NextResponse.json(
        { error: "No puedes cancelar una reserva que ya comenzó." },
        { status: 409 },
      );
    }

    const result = await prisma.reservation.updateMany({
      where: {
        id,
        userId: session.userId,
        status: ReservationStatus.CONFIRMED,
        startAt: { gt: new Date() },
      },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "La reserva cambió de estado. Actualiza e inténtalo de nuevo." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Reserva cancelada correctamente.",
    });
  } catch (error) {
    console.error("Error al cancelar reserva:", error);

    return NextResponse.json(
      { error: "No se pudo cancelar la reserva." },
      { status: 500 },
    );
  }
}
