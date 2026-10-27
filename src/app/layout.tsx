import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoSpace | Encuentra tu espacio de trabajo",
  description:
    "Descubre y reserva espacios de coworking, escritorios y salas de reuniones con CoSpace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}