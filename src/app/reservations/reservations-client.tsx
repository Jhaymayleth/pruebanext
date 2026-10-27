
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BOOKING_MAX_ADVANCE_DAYS,
  BOOKING_MAX_HOURS,
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
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

      setReservations(result.data);
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

  const minDateTime = toLocalInputValue(new Date());

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
    <main>
      <h1>Mis reservas</h1>

      <section>
        <h2>Reservar un espacio</h2>

        {spacesLoading && <p role="status">Cargando espacios...</p>}

        {!spacesLoading && spacesError && (
          <div role="alert">
            <p>{spacesError}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Volver a cargar
            </button>
          </div>
        )}

        {!spacesLoading && !spacesError && spaces.length === 0 && (
          <p>No hay espacios activos disponibles para reservar.</p>
        )}

        {!spacesLoading && !spacesError && spaces.length > 0 && (
          <form onSubmit={handleCreateReservation}>
            <p>
              Las reservas duran entre {BOOKING_MIN_HOURS} y {BOOKING_MAX_HOURS}{" "}
              horas completas, en horas exactas, entre las 07:00 y las 21:00
              (hora de Colombia) y con máximo {BOOKING_MAX_ADVANCE_DAYS} días de
              anticipación.
            </p>

            <div>
              <label htmlFor="spaceId">Espacio</label>
              <select
                id="spaceId"
                value={selectedSpaceId}
                onChange={(event) => setSelectedSpaceId(event.target.value)}
                required
                disabled={submitting}
              >
                <option value="">Selecciona un espacio</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} — {TYPE_LABELS[space.type]} —{" "}
                    {formatPrice(space.pricePerHour)}/hora
                  </option>
                ))}
              </select>
            </div>

            {selectedSpace && (
              <div>
                <p>{selectedSpace.description}</p>
                <p>Capacidad: {selectedSpace.capacity} personas</p>
                <p>Precio por hora: {formatPrice(selectedSpace.pricePerHour)}</p>
              </div>
            )}

            <div>
              <label htmlFor="startAt">Fecha y hora de inicio</label>
              <input
                id="startAt"
                type="datetime-local"
                value={startAt}
                min={minDateTime}
                step={3600}
                onChange={(event) => setStartAt(event.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="endAt">Fecha y hora de finalización</label>
              <input
                id="endAt"
                type="datetime-local"
                value={endAt}
                min={startAt || minDateTime}
                step={3600}
                onChange={(event) => setEndAt(event.target.value)}
                required
                disabled={submitting}
              />
            </div>

            {estimatedPrice !== null && Number.isFinite(estimatedPrice) && (
              <p>
                Precio estimado: {formatPrice(estimatedPrice)}
                {" "}({durationHours.toLocaleString("es-CO")} horas)
              </p>
            )}

            {formError && <p role="alert">{formError}</p>}
            {successMessage && <p role="status">{successMessage}</p>}

            {loginRequired && (
              <p>
                Para gestionar tus reservas,{" "}
                <a href="/login">inicia sesión</a>.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || spaces.length === 0}
            >
              {submitting ? "Procesando..." : "Confirmar reserva"}
            </button>
          </form>
        )}
      </section>

      <section>
        <h2>Historial de reservas</h2>

        {reservationsLoading && (
          <p role="status">Cargando tus reservas...</p>
        )}

        {!reservationsLoading && loginRequired && (
          <p>
            <a href="/login">Inicia sesión</a> para consultar y cancelar tus
            reservas.
          </p>
        )}

        {!reservationsLoading && reservationsError && (
          <div role="alert">
            <p>{reservationsError}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Volver a cargar
            </button>
          </div>
        )}

        {!reservationsLoading &&
          !loginRequired &&
          !reservationsError &&
          reservations.length === 0 && (
            <p>Aún no tienes reservas registradas.</p>
          )}

        {!reservationsLoading &&
          !loginRequired &&
          !reservationsError &&
          reservations.length > 0 && (
            <div>
              {reservations.map((reservation) => (
                <article key={reservation.id}>
                  <h3>{reservation.space.name}</h3>
                  <p>Tipo: {TYPE_LABELS[reservation.space.type]}</p>
                  <p>Capacidad: {reservation.space.capacity} personas</p>
                  <p>Inicio: {formatDate(reservation.startAt)}</p>
                  <p>Fin: {formatDate(reservation.endAt)}</p>
                  <p>Precio total: {formatPrice(reservation.totalPrice)}</p>
                  <p>
                    Estado:{" "}
                    {reservation.status === "CONFIRMED"
                      ? "Confirmada"
                      : "Cancelada"}
                  </p>

                  {reservation.status === "CONFIRMED" &&
                    new Date(reservation.startAt).getTime() > Date.now() && (
                      <button
                        type="button"
                        disabled={cancellingId === reservation.id}
                        onClick={() =>
                          void handleCancelReservation(reservation.id)
                        }
                      >
                        {cancellingId === reservation.id
                          ? "Cancelando..."
                          : "Cancelar reserva"}
                      </button>
                    )}
                </article>
              ))}
            </div>
          )}
      </section>
    </main>
  );
}
