import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import {
  BOOKING_MIN_CANCELLATION_HOURS,
  getCancellationDeadline,
} from "@/lib/booking-rules";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(_request: Request, context: RouteContext) {
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

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Identificador de reserva inválido." },
      { status: 400 },
    );
  }

  const isAdmin = session.role === "ADMIN";

  try {
    const reservation = await prisma.reservation.findFirst({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        startAt: true,
      },
    });

    if (!reservation || (!isAdmin && reservation.userId !== session.userId)) {
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

    const now = new Date();

    if (reservation.startAt <= now) {
      return NextResponse.json(
        { error: "No puedes cancelar una reserva que ya comenzó." },
        { status: 409 },
      );
    }

    const deadline = getCancellationDeadline(reservation.startAt);

    if (!isAdmin && now > deadline) {
      return NextResponse.json(
        {
          error: `Solo puedes cancelar hasta ${BOOKING_MIN_CANCELLATION_HOURS} horas antes del inicio de la reserva.`,
        },
        { status: 409 },
      );
    }

    const result = await prisma.reservation.updateMany({
      where: {
        id,
        status: ReservationStatus.CONFIRMED,
        ...(isAdmin
          ? { startAt: { gt: now } }
          : { userId: session.userId, startAt: { gte: deadline } }),
      },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: now,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          error:
            "La reserva cambió de estado. Actualiza e inténtalo de nuevo.",
        },
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
