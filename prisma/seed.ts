import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Prisma,
  PrismaClient,
  SpaceType,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminName = process.env.ADMIN_NAME?.trim() || "Administrador CoSpace";
const adminEmail = (
  process.env.ADMIN_EMAIL?.trim() || "admin@cospace.com"
).toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "Admin123456";

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

async function seedAdmin() {
  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: "ADMIN",
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
    select: { id: true },
  });
}

async function seedSpaces() {
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
}

async function main() {
  await seedAdmin();
  await seedSpaces();

  console.log(`Administrador listo: ${adminEmail}`);
  console.log(`Se verificaron ${spaces.length} espacios de prueba.`);
}

main()
  .catch((error) => {
    console.error("Error al ejecutar el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
