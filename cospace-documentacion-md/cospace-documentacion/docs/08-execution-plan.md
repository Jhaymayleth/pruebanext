# 08 — Plan de ejecución: 7 horas de reloj

## 1. Restricción real de tiempo
Horario indicado: 06:00–13:00. Descansos: 07:40–08:00, 09:40–10:00 y 11:40–12:00. Son 60 minutos de descanso, por lo que quedan **6 horas efectivas de trabajo**.

## 2. Plan por bloques
| Hora | Duración efectiva | Objetivo | Resultado verificable |
|---|---:|---|---|
| 06:00–06:20 | 20 min | Inicializar repo/proyecto, instalar dependencias esenciales, preparar env | App arranca y estructura base |
| 06:20–07:00 | 40 min | Modelo de datos, conexión DB, migración y seed | DB accesible y datos de ejemplo |
| 07:00–07:40 | 40 min | Auth: registro/login, hash, cookies y helpers de sesión | Login y registro funcionales |
| 07:40–08:00 | Descanso | Descanso obligatorio | — |
| 08:00–08:45 | 45 min | Route Handlers de espacios y reglas de reservas | API central validada |
| 08:45–09:40 | 55 min | Páginas públicas, catálogo, detalle y layouts | Recorrido público funcional |
| 09:40–10:00 | Descanso | Descanso obligatorio | — |
| 10:00–10:40 | 40 min | Dashboard CSR, creación/cancelación de reservas | Flujo de reserva principal |
| 10:40–11:10 | 30 min | Panel admin y control de rol | Gestión básica de espacios |
| 11:10–11:40 | 30 min | i18n, hidratación, responsive y `next/image` | Requisitos UI principales cubiertos |
| 11:40–12:00 | Descanso | Descanso obligatorio | — |
| 12:00–12:25 | 25 min | Dockerfile, variables y README | Instrucciones reproducibles |
| 12:25–12:45 | 20 min | Pruebas críticas y correcciones | Flujos esenciales verificados |
| 12:45–13:00 | 15 min | Deploy, repo público, TXT y ZIP | Entregables preparados |

## 3. Prioridades
### P0 — No negociar
- Proyecto arranca.
- PostgreSQL, ORM, migración y seed.
- Auth con cookies seguras y autorización en backend.
- Catálogo/detalle.
- Crear/listar/cancelar reservas con reglas críticas.
- Protección de datos entre usuarios.
- README y entregables.

### P1 — Requisitos explícitos restantes
- Panel admin.
- Renderizado solicitado.
- i18n.
- `next/image`.
- Componente sin error de hidratación.
- Dockerfile.
- Despliegue Vercel.

### P2 — Extras si queda tiempo
- Rate limiting.
- Idempotencia.
- CI.
- Pruebas adicionales.
- docker-compose.

## 4. Regla de control
Si un bloque se retrasa, recortar extras y pulido visual antes de sacrificar autorización, integridad de reservas o capacidad de ejecutar el proyecto. Mantener un margen final para verificar y entregar.

## 5. Riesgos
- Las reglas de solapamiento y el límite de reservas requieren cuidado por concurrencia.
- Auth con refresh token puede consumir más tiempo de lo esperado.
- Despliegue depende de credenciales y configuración externa disponibles antes de la prueba.
- La rúbrica de Moodle no viene en el documento; consultarla antes de priorizar detalles.
