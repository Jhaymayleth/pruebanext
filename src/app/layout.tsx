import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const darkerGrotesque = localFont({
  src: [
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../fonts/darker-grotesque/DarkerGrotesque-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-dg",
  display: "swap",
});

const mathline = localFont({
  src: [{ path: "../../fonts/mathline/Mathline.otf", weight: "400" }],
  variable: "--font-ml",
  display: "swap",
});

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
    <html
      lang="es"
      className={cn(
        "font-sans",
        darkerGrotesque.variable,
        mathline.variable,
      )}
    >
      <body>{children}</body>
    </html>
  );
}