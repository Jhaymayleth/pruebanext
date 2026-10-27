
import { NextRequest, NextResponse } from "next/server";
import { Prisma, ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

const reservationSchema = z
  .object({
    spaceId: z.string().uuid(),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (data) =>
      new Date(data.endAt).getTime() >
      new Date(data.startAt).getTime(),
    {
      message: "La fecha final debe ser posterior a la inicial.",
      path: ["endAt"],
    },
  )
  .refine(
    (data) => {
      const duration =
        (new Date(data.endAt).getTime() -
          new Date(data.startAt).getTime()) /
        (1000 * 60 * 60);

      return duration >= 1 && duration <= 12;
    },
    {
      message: "La reserva debe durar entre 1 y 12 horas.",
      path: ["endAt"],
    },
  )
  .refine(
    (data) => new Date(data.startAt).getTime() > Date.now(),
    {
      message: "La reserva debe comenzar en el futuro.",
      path: ["startAt"],
    },
  );

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

if (
  body === null ||
  typeof body !== "object" ||
  Array.isArray(body)
) {
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

  const { spaceId, startAt, endAt } = parsed.data;
  const start = new Date(startAt);
  const end = new Date(endAt);

  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        // Serializa las reservas del mismo espacio para evitar
        // que dos solicitudes simultáneas se solapen.
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
            name: true,
            isActive: true,
            pricePerHour: true,
          },
        });

        if (!space || !space.isActive) {
          throw new Error("SPACE_NOT_AVAILABLE");
        }

        const conflict = await tx.reservation.findFirst({
          where: {
            spaceId,
            status: ReservationStatus.CONFIRMED,
            startAt: { lt: end },
            endAt: { gt: start },
          },
          select: { id: true },
        });

        if (conflict) {
          throw new Error("RESERVATION_CONFLICT");
        }

        const durationHours =
          (end.getTime() - start.getTime()) /
          (1000 * 60 * 60);

        const totalPrice = new Prisma.Decimal(
          space.pricePerHour.toString(),
        ).mul(durationHours);

        return tx.reservation.create({
          data: {
            userId: session.userId,
            spaceId,
            startAt: start,
            endAt: end,
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
    if (error instanceof Error && error.message === "SPACE_NOT_AVAILABLE") {
      return NextResponse.json(
        { error: "El espacio no existe o no está disponible." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "RESERVATION_CONFLICT") {
      return NextResponse.json(
        { error: "El espacio ya está reservado en ese horario." },
        { status: 409 },
      );
    }

    console.error("Error al crear reserva:", error);

    return NextResponse.json(
      { error: "No se pudo crear la reserva." },
      { status: 500 },
    );
  }
}
