
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, SpaceType } from "../src/generated/prisma/client";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const spaces = [
  {
    name: "Puesto de trabajo individual",
    description: "Espacio individual con conexión eléctrica.",
    type: SpaceType.DESK,
    capacity: 1,
    pricePerHour: new Prisma.Decimal(8000),
  },
  {
    name: "Sala de reuniones",
    description: "Sala equipada para reuniones y trabajo colaborativo.",
    type: SpaceType.MEETING_ROOM,
    capacity: 6,
    pricePerHour: new Prisma.Decimal(30000),
  },
  {
    name: "Cabina individual",
    description: "Espacio privado para llamadas y videoconferencias.",
    type: SpaceType.BOOTH,
    capacity: 1,
    pricePerHour: new Prisma.Decimal(12000),
  },
];

async function main() {
  for (const space of spaces) {
    const existing = await prisma.space.findFirst({
      where: { name: space.name },
      select: { id: true },
    });

    if (existing) {
      await prisma.space.update({
        where: { id: existing.id },
        data: { ...space, isActive: true },
      });
    } else {
      await prisma.space.create({
        data: { ...space, isActive: true },
      });
    }
  }

  console.log(`Se verificaron ${spaces.length} espacios de prueba.`);
}

main()
  .catch((error) => {
    console.error("Error al crear espacios de prueba:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
