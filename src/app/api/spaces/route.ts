
import { NextRequest, NextResponse } from "next/server";
import { SpaceType, ReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z
  .object({
    type: z.enum(["DESK", "MEETING_ROOM", "BOOTH"]).optional(),
    startAt: z.string().datetime({ offset: true }).optional(),
    endAt: z.string().datetime({ offset: true }).optional(),
  })
  .refine(
    (data) => Boolean(data.startAt) === Boolean(data.endAt),
    {
      message: "startAt y endAt deben enviarse juntos.",
    },
  )
  .refine(
    (data) =>
      !data.startAt ||
      !data.endAt ||
      new Date(data.startAt).getTime() <
        new Date(data.endAt).getTime(),
    {
      message: "endAt debe ser posterior a startAt.",
    },
  );

export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Parámetros de consulta inválidos.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { type, startAt, endAt } = parsed.data;

    const spaces = await prisma.space.findMany({
      where: {
        isActive: true,
        ...(type ? { type: type as SpaceType } : {}),
        ...(startAt && endAt
          ? {
              reservations: {
                none: {
                  status: ReservationStatus.CONFIRMED,
                  startAt: { lt: new Date(endAt) },
                  endAt: { gt: new Date(startAt) },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        pricePerHour: true,
        isActive: true,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      {
        data: spaces.map((space) => ({
          ...space,
          pricePerHour: space.pricePerHour.toString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error al listar espacios:", error);

    return NextResponse.json(
      { error: "No se pudieron obtener los espacios." },
      { status: 500 },
    );
  }
}
