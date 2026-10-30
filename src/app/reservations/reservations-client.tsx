"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useSession } from "@/hooks/use-session";
import {
  BOOKING_MAX_ADVANCE_DAYS,
  BOOKING_MAX_FUTURE_RESERVATIONS,
  BOOKING_MAX_HOURS,
  BOOKING_MIN_CANCELLATION_HOURS,
  BOOKING_MIN_HOURS,
  validateBookingSlot,
} from "@/lib/booking-rules";

type SpaceType = "DESK" | "MEETING_ROOM" | "BOOTH";
type ReservationStatus = "CONFIRMED" | "CANCELLED";

type Space = {
  id: string;
  name: string;
  description: string;
  type: SpaceType;
  capacity: number;
  pricePerHour: string;
  isActive: boolean;
};

type Reservation = {
  id: string;
  startAt: string;
  endAt: string;
  totalPrice: string;
  status: ReservationStatus;
  createdAt: string;
  cancelledAt: string | null;
  space: {
    id: string;
    name: string;
    type: SpaceType;
    capacity: number;
  };
};

type ReservationView = Reservation & {
  cancelable: boolean;
  withinCancellationWindow: boolean;
  started: boolean;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

type ReservationsClientProps = {
  initialSpaceId: string;
};

const TYPE_LABELS: Record<SpaceType, string> = {
  DESK: "Puesto de trabajo",
  MEETING_ROOM: "Sala de reuniones",
  BOOTH: "Cabina individual",
};

const CANCELLATION_WINDOW_MS = BOOKING_MIN_CANCELLATION_HOURS * 60 * 60 * 1000;

function formatPrice(value: string | number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} COP`;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toLocalInputValue(date: Date): string {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function nextWholeHourInputValue(): string {
  const now = new Date();
  const rounded = new Date(now);

  rounded.setMinutes(0, 0, 0);

  if (rounded.getTime() <= now.getTime()) {
    rounded.setHours(rounded.getHours() + 1);
  }

  return toLocalInputValue(rounded);
}

function toReservationView(reservation: Reservation): ReservationView {
  const start = new Date(reservation.startAt).getTime();
  const now = Date.now();
  const started = start <= now;
  const withinCancellationWindow = start - now <= CANCELLATION_WINDOW_MS;

  return {
    ...reservation,
    started,
    withinCancellationWindow,
    cancelable: !started && !withinCancellationWindow,
  };
}

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }
}

export default function ReservationsClient({
  initialSpaceId,
}: ReservationsClientProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<ReservationView[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(initialSpaceId);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [spacesError, setSpacesError] = useState("");
  const [reservationsError, setReservationsError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [router, status]);

  const loadSpaces = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/spaces", {
        signal,
        cache: "no-store",
      });

      const result = await readResponse<Space[]>(response);

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudieron cargar los espacios.");
      }

      if (!Array.isArray(result.data)) {
        throw new Error("La respuesta de espacios no tiene el formato esperado.");
      }

      if (signal.aborted) return;

      setSpaces(result.data);
      setSpacesError("");
    } catch (err) {
      if (signal.aborted) return;

      setSpaces([]);
      setSpacesError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los espacios.",
      );
    } finally {
      if (!signal.aborted) {
        setSpacesLoading(false);
      }
    }
  }, []);

  const loadReservations = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/reservations", {
        signal,
        cache: "no-store",
      });

      const result = await readResponse<Reservation[]>(response);

      if (signal.aborted) return;

      if (response.status === 401) {
        setReservations([]);
        setLoginRequired(true);
        setReservationsError("");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ?? "No se pudieron cargar tus reservas.",
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("La respuesta de reservas no tiene el formato esperado.");
      }

      setReservations(result.data.map(toReservationView));
      setLoginRequired(false);
      setReservationsError("");
    } catch (err) {
      if (signal.aborted) return;

      setReservations([]);
      setReservationsError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar tus reservas.",
      );
    } finally {
      if (!signal.aborted) {
        setReservationsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadSpaces(controller.signal);

    return () => controller.abort();
  }, [loadSpaces, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    void loadReservations(controller.signal);

    return () => controller.abort();
  }, [loadReservations, refreshKey]);

  const selectedSpace = spaces.find(
    (space) => space.id === selectedSpaceId,
  );

  const durationHours =
    startAt && endAt
      ? (new Date(endAt).getTime() - new Date(startAt).getTime()) /
        (60 * 60 * 1000)
      : 0;

  const estimatedPrice =
    selectedSpace && durationHours > 0
      ? Number(selectedSpace.pricePerHour) * durationHours
      : null;

  const minDateTime = nextWholeHourInputValue();

  const confirmedReservations = reservations.filter(
    (reservation) => reservation.status === "CONFIRMED",
  );
  const upcomingReservations = reservations.filter(
    (reservation) => reservation.status === "CONFIRMED" && !reservation.started,
  );

  async function handleCreateReservation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!selectedSpaceId) {
      setFormError("Selecciona un espacio.");
      return;
    }

    if (!startAt || !endAt) {
      setFormError("Selecciona la fecha y hora de inicio y finalización.");
      return;
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    const violation = validateBookingSlot(start, end);

    if (violation) {
      setFormError(violation.message);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spaceId: selectedSpaceId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
        }),
      });

      const result = await readResponse<Reservation>(response);

      if (response.status === 401) {
        setFormError(
          result.error ?? "Debes iniciar sesión para realizar una reserva.",
        );
        return;
      }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo crear la reserva.");
      }

      setSuccessMessage(result.message ?? "Reserva creada correctamente.");
      setStartAt("");
      setEndAt("");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la reserva.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    const confirmed = window.confirm(
      "¿Seguro que deseas cancelar esta reserva?",
    );

    if (!confirmed) return;

    setCancellingId(reservationId);
    setReservationsError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(reservationId)}`,
        { method: "PATCH" },
      );

      const result = await readResponse<never>(response);

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo cancelar la reserva.");
      }

      setSuccessMessage(result.message ?? "Reserva cancelada correctamente.");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setReservationsError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cancelar la reserva.",
      );
    } finally {
      setCancellingId("");
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto w-full max-w-[1240px] px-5 py-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <Badge className="w-fit font-display uppercase tracking-[0.2em]">
                Panel personal
              </Badge>
              <h1 className="mt-5 font-heading text-[clamp(2.5rem,5vw,4rem)] font-black leading-[0.95] tracking-tight">
                Mis reservas
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Reserva en bloques de {BOOKING_MIN_HOURS} a {BOOKING_MAX_HOURS}{" "}
                horas, en horas exactas, y cancela hasta{" "}
                {BOOKING_MIN_CANCELLATION_HOURS} horas antes del inicio.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 lg:w-auto">
              {[
                {
                  value: String(reservations.length),
                  label: "registradas",
                },
                {
                  value: String(confirmedReservations.length),
                  label: "confirmadas",
                },
                {
                  value: String(upcomingReservations.length),
                  label: "por venir",
                },
              ].map((stat) => (
                <div key={stat.label} className="bento-cell soft min-w-0 flex-1">
                  <p className="font-display text-3xl leading-none text-[#242a23]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <section className="mt-8 grid grid-cols-12 gap-4">
          <Reveal className="col-span-12 lg:col-span-7">
            <Card className="h-full border-line bg-transparent shadow-none">
              <CardHeader>
                <CardTitle className="font-heading text-3xl font-black tracking-tight">
                  Reservar un espacio
                </CardTitle>
                <CardDescription>
                  Elige el espacio, la fecha y el horario. El precio total lo
                  calcula el servidor antes de confirmar.
                </CardDescription>
              </CardHeader>

              {spacesLoading && (
                <CardContent className="grid gap-4">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-11 animate-pulse rounded-lg bg-[#f2f2ee]"
                    />
                  ))}
                  <p role="status" className="text-sm text-muted-foreground">
                    Cargando espacios...
                  </p>
                </CardContent>
              )}

              {!spacesLoading && spacesError && (
                <CardContent>
                  <div role="alert" className="bento-cell">
                    <p className="font-heading text-xl font-bold">
                      {spacesError}
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => setRefreshKey((key) => key + 1)}
                    >
                      Volver a cargar
                    </Button>
                  </div>
                </CardContent>
              )}

              {!spacesLoading && !spacesError && spaces.length === 0 && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No hay espacios activos disponibles para reservar.
                  </p>
                </CardContent>
              )}

              {!spacesLoading && !spacesError && spaces.length > 0 && (
                <form onSubmit={handleCreateReservation}>
                  <CardContent className="grid gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="spaceId">Espacio</Label>
                      <Select
                        value={selectedSpaceId || undefined}
                        onValueChange={(value) => setSelectedSpaceId(value)}
                        disabled={submitting}
                      >
                        <SelectTrigger id="spaceId" className="w-full">
                          <SelectValue placeholder="Selecciona un espacio" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces.map((space) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name} — {TYPE_LABELS[space.type]} —{" "}
                              {formatPrice(space.pricePerHour)}/hora
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSpace && (
                      <div className="bento-cell soft">
                        <p className="font-heading text-xl font-bold leading-snug">
                          {selectedSpace.name}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {selectedSpace.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full border border-line bg-background px-3 py-1">
                            Capacidad: {selectedSpace.capacity}{" "}
                            {selectedSpace.capacity === 1
                              ? "persona"
                              : "personas"}
                          </span>
                          <span className="rounded-full border border-line bg-background px-3 py-1">
                            {formatPrice(selectedSpace.pricePerHour)}/hora
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="startAt">Fecha y hora de inicio</Label>
                        <Input
                          id="startAt"
                          type="datetime-local"
                          value={startAt}
                          min={minDateTime}
                          step={3600}
                          suppressHydrationWarning
                          onChange={(event) => setStartAt(event.target.value)}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="endAt">Fecha y hora de finalización</Label>
                        <Input
                          id="endAt"
                          type="datetime-local"
                          value={endAt}
                          min={startAt || minDateTime}
                          step={3600}
                          suppressHydrationWarning
                          onChange={(event) => setEndAt(event.target.value)}
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Reservas de {BOOKING_MIN_HOURS} a {BOOKING_MAX_HOURS}{" "}
                      horas completas, de 07:00 a 21:00 (hora de Colombia), con
                      máximo {BOOKING_MAX_ADVANCE_DAYS} días de anticipación y{" "}
                      {BOOKING_MAX_FUTURE_RESERVATIONS} reservas futuras
                      confirmadas por cuenta.
                    </p>

                    {estimatedPrice !== null && Number.isFinite(estimatedPrice) && (
                      <div className="bento-cell accent flex items-center justify-between gap-4">
                        <div>
                          <p className="font-display text-xs uppercase tracking-[0.24em] text-[#4c5a2e]">
                            Precio estimado
                          </p>
                          <p className="mt-2 font-heading text-3xl font-black leading-none text-[#242a23]">
                            {formatPrice(estimatedPrice)}
                          </p>
                        </div>
                        <p className="font-display text-sm text-[#4c5a2e]">
                          {durationHours.toLocaleString("es-CO")} horas
                        </p>
                      </div>
                    )}

                    {formError && (
                      <p
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                      >
                        {formError}
                      </p>
                    )}

                    {successMessage && (
                      <p
                        role="status"
                        className="rounded-lg border border-[#8fbf4a]/40 bg-[#eef7dd] px-4 py-3 text-sm text-[#41611c]"
                      >
                        {successMessage}
                      </p>
                    )}

                    {loginRequired && (
                      <p className="text-sm text-muted-foreground">
                        Para gestionar tus reservas,{" "}
                        <Link
                          href="/login"
                          className="font-medium text-foreground underline underline-offset-4"
                        >
                          inicia sesión
                        </Link>
                        .
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="mt-1">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || spaces.length === 0}
                    >
                      {submitting ? "Procesando..." : "Confirmar reserva"}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>
          </Reveal>

          <Reveal delay={140} className="col-span-12 lg:col-span-5">
            <div className="bento-cell dark flex h-full flex-col justify-between gap-8">
              <div>
                <p className="font-display text-xs uppercase tracking-[0.28em] text-[#c1ce9c]">
                  Reglas de la casa
                </p>
                <h2 className="mt-5 font-heading text-3xl font-black leading-tight tracking-tight">
                  Reservar sin sorpresas.
                </h2>
              </div>

              <ul className="grid gap-4 text-sm text-white/75">
                {[
                  `${BOOKING_MIN_HOURS}–${BOOKING_MAX_HOURS} horas en bloques exactos`,
                  "Ventana de 07:00 a 21:00 hora de Colombia",
                  `${BOOKING_MAX_ADVANCE_DAYS} días de anticipación como máximo`,
                  `${BOOKING_MAX_FUTURE_RESERVATIONS} reservas futuras por cuenta`,
                  `Cancelación hasta ${BOOKING_MIN_CANCELLATION_HOURS} horas antes`,
                  "Sin solapes con otras reservas propias",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#d9fa72]" />
                    {rule}
                  </li>
                ))}
              </ul>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-display text-xs uppercase tracking-[0.24em] text-[#c1ce9c]">
                  ¿Buscas un espacio?
                </p>
                <Button
                  className="mt-3 w-full bg-[#d9fa72] text-[#242a23] hover:bg-[#cdf55e]"
                  asChild
                >
                  <Link href="/spaces">Ver el catálogo</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="mt-4 grid grid-cols-12 gap-4">
          <Reveal className="col-span-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge className="w-fit font-display uppercase tracking-[0.2em]">
                  Historial
                </Badge>
                <h2 className="mt-4 font-heading text-3xl font-black leading-tight tracking-tight">
                  Tus reservas
                </h2>
              </div>

              {reservationsLoading && (
                <p role="status" className="text-sm text-muted-foreground">
                  Cargando tus reservas...
                </p>
              )}
            </div>
          </Reveal>

          {!reservationsLoading && loginRequired && (
            <Reveal className="col-span-12">
              <div className="bento-cell soft">
                <p className="font-heading text-2xl font-bold">
                  Inicia sesión para consultar y cancelar tus reservas.
                </p>
                <Button className="mt-5" asChild>
                  <Link href="/login">Ir a iniciar sesión</Link>
                </Button>
              </div>
            </Reveal>
          )}

          {!reservationsLoading && reservationsError && (
            <Reveal className="col-span-12">
              <div role="alert" className="bento-cell">
                <p className="font-heading text-2xl font-bold">
                  {reservationsError}
                </p>
                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Volver a cargar
                </Button>
              </div>
            </Reveal>
          )}

          {!reservationsLoading &&
            !loginRequired &&
            !reservationsError &&
            reservations.length === 0 && (
              <Reveal className="col-span-12">
                <div className="bento-cell soft">
                  <p className="font-heading text-2xl font-bold">
                    Aún no tienes reservas registradas.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Elige un espacio arriba o explora el catálogo para empezar.
                  </p>
                </div>
              </Reveal>
            )}

          {!reservationsLoading &&
            !loginRequired &&
            !reservationsError &&
            reservations.length > 0 &&
            reservations.map((reservation, index) => (
              <Reveal
                key={reservation.id}
                delay={index * 70}
                className="col-span-12 md:col-span-6"
              >
                <Card className="h-full border-line bg-transparent shadow-none transition hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-34px_rgba(32,37,31,0.6)]">
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge
                        variant={
                          reservation.status === "CONFIRMED"
                            ? "default"
                            : "secondary"
                        }
                        className="font-display uppercase tracking-[0.16em]"
                      >
                        {reservation.status === "CONFIRMED"
                          ? "Confirmada"
                          : "Cancelada"}
                      </Badge>
                      <span className="font-heading text-2xl font-black text-[#7d8c4f]">
                        {formatPrice(reservation.totalPrice)}
                      </span>
                    </div>

                    <CardTitle className="font-heading text-2xl font-bold leading-tight tracking-tight">
                      {reservation.space.name}
                    </CardTitle>

                    <CardDescription className="text-sm">
                      {TYPE_LABELS[reservation.space.type]} · Capacidad{" "}
                      {reservation.space.capacity}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-3">
                      <span>Inicio</span>
                      <span className="text-right text-foreground">
                        {formatDate(reservation.startAt)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Fin</span>
                      <span className="text-right text-foreground">
                        {formatDate(reservation.endAt)}
                      </span>
                    </div>

                    {reservation.cancelledAt && (
                      <div className="flex justify-between gap-3">
                        <span>Cancelada el</span>
                        <span className="text-right text-foreground">
                          {formatDate(reservation.cancelledAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  {reservation.status === "CONFIRMED" && (
                    <CardFooter className="flex-col items-stretch gap-2">
                      {reservation.cancelable && (
                        <Button
                          variant="outline"
                          disabled={cancellingId === reservation.id}
                          onClick={() =>
                            void handleCancelReservation(reservation.id)
                          }
                        >
                          {cancellingId === reservation.id
                            ? "Cancelando..."
                            : "Cancelar reserva"}
                        </Button>
                      )}

                      {reservation.started && (
                        <p className="text-center text-xs text-muted-foreground">
                          Reserva en curso
                        </p>
                      )}

                      {!reservation.started &&
                        !reservation.cancelable && (
                          <p className="text-center text-xs text-muted-foreground">
                            Cancelación no disponible: faltan menos de{" "}
                            {BOOKING_MIN_CANCELLATION_HOURS} horas para el
                            inicio.
                          </p>
                        )}
                    </CardFooter>
                  )}
                </Card>
              </Reveal>
            ))}
        </section>
      </div>

      <footer className="mt-6 border-t border-line">
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