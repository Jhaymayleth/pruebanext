
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type SpacesState = {
  requestKey: string;
  status: "success" | "error";
  spaces: Space[];
  error: string;
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
  const [selectedType, setSelectedType] = useState<SpaceType | "">("");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<SpacesState>({
    requestKey: "",
    status: "success",
    spaces: [],
    error: "",
  });

  const requestKey = `${selectedType || "ALL"}:${reloadKey}`;
  const loading = result.requestKey !== requestKey;
  const error = loading ? "" : result.error;
  const spaces = loading || error ? [] : result.spaces;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSpaces() {
      try {
        const params = new URLSearchParams();

        if (selectedType) {
          params.set("type", selectedType);
        }

        const query = params.toString();
        const url = query ? `/api/spaces?${query}` : "/api/spaces";

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        const data: SpacesResponse = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ?? "No se pudieron obtener los espacios.",
          );
        }

        if (!Array.isArray(data.data)) {
          throw new Error(
            "La respuesta del servidor no tiene el formato esperado.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setResult({
          requestKey,
          status: "success",
          spaces: data.data,
          error: "",
        });
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }

        setResult({
          requestKey,
          status: "error",
          spaces: [],
          error:
            err instanceof Error
              ? err.message
              : "Ocurrió un error inesperado al cargar los espacios.",
        });
      }
    }

    void fetchSpaces();

    return () => controller.abort();
  }, [selectedType, requestKey]);

    const router = useRouter();

    function handleReserve(spaceId: string) {
        const params = new URLSearchParams({ spaceId });
        router.push(`/reservations?${params.toString()}`);
    }

  return (
    <main>
      <h1>Espacios disponibles</h1>

      <div>
        <label htmlFor="space-type">Filtrar por tipo: </label>

        <select
          id="space-type"
          value={selectedType}
          onChange={(event) =>
            setSelectedType(event.target.value as SpaceType | "")
          }
          disabled={loading}
        >
          {SPACE_TYPES.map((type) => (
            <option key={type.value || "all"} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p role="status">Cargando espacios...</p>}

      {!loading && error && (
        <section role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Volver a intentar
          </button>
        </section>
      )}

      {!loading && !error && spaces.length === 0 && (
        <section>
          <p>No hay espacios disponibles para este filtro.</p>

          {selectedType && (
            <button type="button" onClick={() => setSelectedType("")}>
              Ver todos los tipos
            </button>
          )}
        </section>
      )}

      {!loading && !error && spaces.length > 0 && (
        <section>
          <p>Total de espacios: {spaces.length}</p>

          {spaces.map((space) => (
            <article key={space.id}>
              <h2>{space.name}</h2>
              <p>{space.description}</p>
              <p>Tipo: {TYPE_LABELS[space.type] ?? space.type}</p>
              <p>Capacidad: {space.capacity} personas</p>
              <p>Precio por hora: {formatPrice(space.pricePerHour)}</p>

              <button
                type="button"
                onClick={() => handleReserve(space.id)}
              >
                Reservar espacio
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
