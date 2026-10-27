import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { Prisma, ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import {
  BOOKING_MAX_FUTURE_RESERVATIONS,
  BookingRuleError,
  getDurationInHours,
  validateBookingSlot,
  type BookingErrorCode,
} from "@/lib/booking-rules";

export const runtime = "nodejs";

const reservationSchema = z.object({
  spaceId: z.string().uuid(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
});

const ERROR_STATUS: Record<BookingErrorCode, number> = {
  SPACE_NOT_AVAILABLE: 404,
  SPACE_ALREADY_RESERVED: 409,
  USER_ALREADY_RESERVED: 409,
  FUTURE_LIMIT_REACHED: 409,
};

const SPACE_OVERLAP_CONSTRAINT = "Reservation_no_space_overlap";
const USER_OVERLAP_CONSTRAINT = "Reservation_no_user_overlap";

function mapOverlapConstraint(error: unknown): BookingRuleError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message.includes(SPACE_OVERLAP_CONSTRAINT)) {
    return new BookingRuleError(
      "SPACE_ALREADY_RESERVED",
      "El espacio ya está reservado en ese horario.",
    );
  }

  if (error.message.includes(USER_OVERLAP_CONSTRAINT)) {
    return new BookingRuleError(
      "USER_ALREADY_RESERVED",
      "Ya tienes una reserva confirmada que se cruza con ese horario.",
    );
  }

  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para consultar tus reservas." },
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

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
        space: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        startAt: "desc",
      },
    });

    return NextResponse.json({
      data: reservations.map((reservation) => ({
        ...reservation,
        totalPrice: reservation.totalPrice.toString(),
      })),
    });
  } catch (error) {
    console.error("Error al consultar reservas:", error);

    return NextResponse.json(
      { error: "No se pudieron consultar las reservas." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para reservar." },
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

  const body: unknown = await request.json().catch(() => null);

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser un objeto JSON válido." },
      { status: 400 },
    );
  }

  const parsed = reservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos de reserva inválidos.",
        details: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { spaceId } = parsed.data;
  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  const now = new Date();

  const violation = validateBookingSlot(startAt, endAt, now);

  if (violation) {
    return NextResponse.json(
      {
        error: violation.message,
        details: [{ path: [violation.path], message: violation.message }],
      },
      { status: 400 },
    );
  }

  const durationHours = getDurationInHours(startAt, endAt);

  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id
          FROM "User"
          WHERE id = ${session.userId}::uuid
          FOR UPDATE
        `;

        await tx.$queryRaw`
          SELECT id
          FROM "Space"
          WHERE id = ${spaceId}::uuid
          FOR UPDATE
        `;

        const space = await tx.space.findUnique({
          where: { id: spaceId },
          select: {
            id: true,
            isActive: true,
            pricePerHour: true,
          },
        });

        if (!space || !space.isActive) {
          throw new BookingRuleError(
            "SPACE_NOT_AVAILABLE",
            "El espacio no existe o no está disponible.",
          );
        }

        const futureReservations = await tx.reservation.count({
          where: {
            userId: session.userId,
            status: ReservationStatus.CONFIRMED,
            startAt: { gt: now },
          },
        });

        if (futureReservations >= BOOKING_MAX_FUTURE_RESERVATIONS) {
          throw new BookingRuleError(
            "FUTURE_LIMIT_REACHED",
            `Solo puedes tener ${BOOKING_MAX_FUTURE_RESERVATIONS} reservas futuras confirmadas.`,
          );
        }

        const spaceConflict = await tx.reservation.findFirst({
          where: {
            spaceId,
            status: ReservationStatus.CONFIRMED,
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        });

        if (spaceConflict) {
          throw new BookingRuleError(
            "SPACE_ALREADY_RESERVED",
            "El espacio ya está reservado en ese horario.",
          );
        }

        const userConflict = await tx.reservation.findFirst({
          where: {
            userId: session.userId,
            status: ReservationStatus.CONFIRMED,
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
          select: { id: true },
        });

        if (userConflict) {
          throw new BookingRuleError(
            "USER_ALREADY_RESERVED",
            "Ya tienes una reserva confirmada que se cruza con ese horario.",
          );
        }

        const totalPrice = new Prisma.Decimal(
          space.pricePerHour.toString(),
        ).mul(durationHours);

        return tx.reservation.create({
          data: {
            userId: session.userId,
            spaceId,
            startAt,
            endAt,
            totalPrice,
          },
          select: {
            id: true,
            spaceId: true,
            startAt: true,
            endAt: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return NextResponse.json(
      {
        message: "Reserva creada correctamente.",
        data: {
          ...reservation,
          totalPrice: reservation.totalPrice.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingRuleError) {
      return NextResponse.json(
        { error: error.message },
        { status: ERROR_STATUS[error.code] },
      );
    }

    const overlap = mapOverlapConstraint(error);

    if (overlap) {
      return NextResponse.json(
        { error: overlap.message },
        { status: ERROR_STATUS[overlap.code] },
      );
    }

    console.error("Error al crear reserva:", error);

    return NextResponse.json(
      { error: "No se pudo crear la reserva." },
      { status: 500 },
    );
  }
}
