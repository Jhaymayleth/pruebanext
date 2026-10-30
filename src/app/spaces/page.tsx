"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";

type SpaceType = "DESK" | "MEETING_ROOM" | "BOOTH";

type Space = {
  id: string;
  name: string;
  description: string;
  type: SpaceType;
  capacity: number;
  pricePerHour: string;
  isActive: boolean;
};

type SpacesResponse = {
  data?: Space[];
  error?: string;
};

const SPACE_TYPES: { value: SpaceType | ""; label: string }[] = [
  { value: "", label: "Todos los espacios" },
  { value: "DESK", label: "Puestos de trabajo" },
  { value: "MEETING_ROOM", label: "Salas de reuniones" },
  { value: "BOOTH", label: "Cabinas individuales" },
];

const TYPE_LABELS: Record<SpaceType, string> = {
  DESK: "Puesto de trabajo",
  MEETING_ROOM: "Sala de reuniones",
  BOOTH: "Cabina individual",
};

const SPAN_CLASSES: Record<SpaceType, string> = {
  DESK: "lg:col-span-6",
  MEETING_ROOM: "lg:col-span-6",
  BOOTH: "lg:col-span-4",
};

function formatPrice(price: string): string {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return `${price} COP`;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedType, setSelectedType] = useState<SpaceType | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadSpaces = useCallback(async (signal: AbortSignal) => {
    try {
      const params = new URLSearchParams();

      if (selectedType) {
        params.set("type", selectedType);
      }

      const query = params.toString();
      const url = query ? `/api/spaces?${query}` : "/api/spaces";

      const response = await fetch(url, {
        method: "GET",
        signal,
        cache: "no-store",
      });

      const result: SpacesResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudieron obtener los espacios.");
      }

      if (!Array.isArray(result.data)) {
        throw new Error(
          "La respuesta del servidor no tiene el formato esperado.",
        );
      }

      setSpaces(result.data);
      setError("");
    } catch (err) {
      if (signal.aborted) {
        return;
      }

      setSpaces([]);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al cargar los espacios.",
      );
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedType]);

  useEffect(() => {
    const controller = new AbortController();

    void loadSpaces(controller.signal);

    return () => controller.abort();
  }, [loadSpaces, reloadKey]);

  function handleReserve(spaceId: string) {
    const params = new URLSearchParams({ spaceId });
    window.location.assign(`/reservations?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[1240px] px-5 py-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge className="w-fit font-display uppercase tracking-[0.2em]">
                Catálogo
              </Badge>
              <h1 className="mt-5 font-heading text-[clamp(2.5rem,5vw,4rem)] font-black leading-[0.95] tracking-tight">
                Espacios disponibles
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Filtra por tipo y reserva en bloques de una a cuatro horas, de
                07:00 a 21:00, con hasta 30 días de anticipación.
              </p>
            </div>

            <div className="w-full md:w-64">
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as SpaceType | "")}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  {SPACE_TYPES.map((type) => (
                    <SelectItem key={type.value || "all"} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Reveal>

        {loading && (
          <div className="mt-8 grid grid-cols-12 gap-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="bento-cell col-span-12 h-52 animate-pulse bg-[#f2f2ee] md:col-span-4"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <Reveal className="mt-8">
            <div className="bento-cell" role="alert">
              <p className="font-heading text-2xl font-bold">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                No pudimos consultar el catálogo. Vuelve a intentarlo.
              </p>
              <Button
                className="mt-5"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Volver a intentar
              </Button>
            </div>
          </Reveal>
        )}

        {!loading && !error && spaces.length === 0 && (
          <Reveal className="mt-8">
            <div className="bento-cell soft">
              <p className="font-heading text-2xl font-bold">
                No hay espacios disponibles para este filtro.
              </p>
              {selectedType && (
                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={() => setSelectedType("")}
                >
                  Ver todos los tipos
                </Button>
              )}
            </div>
          </Reveal>
        )}

        {!loading && !error && spaces.length > 0 && (
          <>
            <Reveal className="mt-8">
              <div className="bento-cell accent flex flex-wrap items-center justify-between gap-3">
                <p className="font-heading text-xl font-bold text-[#242a23]">
                  {spaces.length}{" "}
                  {spaces.length === 1 ? "espacio disponible" : "espacios disponibles"}
                </p>
                <p className="font-display text-sm uppercase tracking-[0.24em] text-[#4c5a2e]">
                  Precio por hora incluido
                </p>
              </div>
            </Reveal>

            <section className="mt-4 grid grid-cols-12 gap-4">
              {spaces.map((space, index) => (
                <Reveal
                  key={space.id}
                  delay={index * 80}
                  className={`col-span-12 ${SPAN_CLASSES[space.type] ?? "lg:col-span-4"}`}
                >
                  <Card className="h-full border-line bg-transparent shadow-none transition hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-34px_rgba(32,37,31,0.6)]">
                    <CardHeader className="gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary" className="font-display uppercase tracking-[0.16em]">
                          {TYPE_LABELS[space.type] ?? space.type}
                        </Badge>
                        <span className="font-display text-2xl text-[#7d8c4f]">
                          {formatPrice(space.pricePerHour)}
                        </span>
                      </div>
                      <CardTitle className="font-heading text-3xl font-bold leading-tight tracking-tight">
                        {space.name}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {space.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-line px-3 py-1">
                        Capacidad: {space.capacity}{" "}
                        {space.capacity === 1 ? "persona" : "personas"}
                      </span>
                      <span className="rounded-full border border-line px-3 py-1">
                        Precio por hora
                      </span>
                      <span className="rounded-full border border-line px-3 py-1">
                        Horario 07:00–21:00
                      </span>
                    </CardContent>

                    <CardFooter>
                      <Button className="w-full" onClick={() => handleReserve(space.id)}>
                        Reservar espacio
                      </Button>
                    </CardFooter>
                  </Card>
                </Reveal>
              ))}
            </section>
          </>
        )}
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
          <span className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <span className="grid size-7 place-items-center rounded-[9px_9px_9px_3px] bg-[#d9fa72] font-display text-xs text-[#242a23]">
              C
            </span>
            CoSpace
          </span>
          <span>Un espacio para cada idea.</span>
          <span>© 2026 CoSpace</span>
        </div>
      </footer>
    </main>
  );
}