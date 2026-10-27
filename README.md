# CoSpace

Plataforma fullstack para explorar y reservar espacios de coworking: puestos de trabajo, salas de reuniones y cabinas individuales. Los usuarios se registran, inician sesión, consultan el catálogo, reservan por horas y cancelan sus propias reservas; los administradores además gestionan el catálogo de espacios.

Todos los datos viven en una base de datos PostgreSQL propia y se exponen mediante route handlers de Next.js: el proyecto no consume ninguna API externa.

## Tabla de contenido

1. [Descripción](#1-descripción)
2. [Requisitos previos](#2-requisitos-previos)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Ejecución en desarrollo](#4-ejecución-en-desarrollo)
5. [Credenciales del administrador](#5-credenciales-del-administrador)
6. [Ejecución con Docker](#6-ejecución-con-docker)
7. [Scripts disponibles](#7-scripts-disponibles)
8. [Estructura de carpetas](#8-estructura-de-carpetas)
9. [API y reglas de negocio](#9-api-y-reglas-de-negocio)
10. [Despliegue](#10-despliegue)

## 1. Descripción

### Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) con React 19 y TypeScript en modo `strict` |
| Base de datos | PostgreSQL en Supabase |
| ORM | Prisma 7 con `@prisma/adapter-pg` y el generador `prisma-client` |
| Autenticación | Propia: `jose` para el access token y refresh token opaco hasheado en la base de datos |
| Validación | `zod` en todos los route handlers |
| Estilos | Tailwind CSS 4 (reset) más los estilos del proyecto en `globals.css` |

### Funcionalidades

- Registro e inicio de sesión con contraseñas hasheadas con bcrypt.
- Catálogo público de espacios activos, con filtro por tipo y disponibilidad por horario.
- Reserva de un espacio por parte de un usuario autenticado, con el precio calculado en el servidor.
- Listado y cancelación de las reservas propias.
- Desactivación de espacios por parte de un administrador.

### Autenticación

- El **access token** es un JWT (HS256) de 15 minutos que viaja en la cookie `access_token` (`httpOnly`, `sameSite=lax`, `secure` en producción).
- El **refresh token** es un valor aleatorio de 32 bytes que se guarda **hasheado con SHA-256** en la tabla `RefreshToken` y viaja en la cookie `refresh_token`. Cada renovación lo rota y revoca el anterior dentro de una transacción; el logout lo revoca.
- Ningún token se devuelve en el cuerpo de la respuesta ni se guarda en `localStorage`.
- Cada route handler valida la sesión y el rol por su cuenta, sin depender del proxy.

## 2. Requisitos previos

Antes de empezar necesitas tener instalado o creado:

- **Node.js 20.9 o superior** y **npm 10 o superior**. Verifica con `node -v` y `npm -v`. El proyecto se desarrolló y probó con Node 24.
- Una **base de datos PostgreSQL**. El proyecto está pensado para **Supabase** (plan gratuito suficiente): crea un proyecto en [supabase.com](https://supabase.com) y espera a que termine de aprovisionarse.
- Opcional: **Docker** (versión 24 o superior) para el punto 6.
- Opcional: **Git** para clonar el repositorio.

No se necesita ningún servicio de terceros aparte de PostgreSQL.

## 3. Variables de entorno

Crea el archivo `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

Después completa cada variable:

| Variable | Para qué sirve | Qué valor lleva y de dónde se obtiene |
|---|---|---|
| `DATABASE_URL` | Cadena que usa la aplicación en tiempo de ejecución. | En Supabase: **Project Settings → Database → Connection string → Transaction pooler** (puerto **6543**). Reemplaza `[YOUR-PASSWORD]` por la contraseña de la base de datos. Añade `?pgbouncer=true&connection_limit=1` al final: el pooler en modo transacción no admite sentencias preparadas persistentes. |
| `DIRECT_URL` | Cadena que usan las **migraciones** y el `prisma generate` con acceso al esquema. | En la misma pantalla: **Session pooler** (puerto **5432**). Es la conexión directa, sin el pooler transaccional. |
| `JWT_SECRET` | Firma y verificación de los access token. | Una cadena aleatoria de **al menos 32 caracteres**. Genera una con `openssl rand -base64 48` (o `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`). Debe ser la misma en todas las instancias de la aplicación. |
| `ADMIN_NAME` | Nombre del administrador que crea el seed. | Texto libre. Si se omite, usa `Administrador CoSpace`. |
| `ADMIN_EMAIL` | Correo del administrador que crea el seed. | Un correo válido. Si se omite, usa `admin@cospace.com`. |
| `ADMIN_PASSWORD` | Contraseña del administrador que crea el seed. | Mínimo 8 caracteres. Si se omite, usa `Admin123456`. Cámbiala en cualquier entorno que no sea de prueba. |

Notas:

- El proyecto **no arranca** si falta `DATABASE_URL` o si `JWT_SECRET` tiene menos de 32 caracteres: al arrancar, `src/lib/prisma.ts` y `src/lib/auth.ts` lanzan un error explicando cuál falta.
- Si defines `ADMIN_PASSWORD`, la contraseña del administrador pasa a ser la tuya. Para aplicarla, vuelve a ejecutar el seed (paso 4d): el seed actualiza el hash del administrador existente.

## 4. Ejecución en desarrollo

Ejecuta los comandos **en este orden** desde la raíz del repositorio:

**a. Clonar e instalar dependencias**

```bash
git clone https://github.com/<tu-usuario>/cospace.git
cd cospace
npm install
```

`npm install` ejecuta `prisma generate` en el `postinstall`, que crea el cliente en `src/generated/prisma`. Esa carpeta no está versionada, así que este paso es obligatorio antes de compilar o arrancar.

**b. Crear el archivo de entorno**

```bash
cp .env.example .env
```

Completa las variables como se explica en el punto 3.

**c. Aplicar las migraciones**

```bash
npm run db:migrate
```

Es un alias de `prisma migrate deploy`: crea todas las tablas, enums, índices y las restricciones que garantizan las reglas de negocio (duración de 1 a 4 horas y bloqueo de solapes por espacio y por usuario).

**d. Ejecutar el seed**

```bash
npm run db:seed
```

Crea el administrador y tres espacios de ejemplo (puesto de trabajo, sala de reuniones y cabina). Es idempotente: puedes ejecutarlo varias veces sin duplicar datos.

**e. Levantar el proyecto**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para una verificación rápida del estado de la base de datos: [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db) debe responder `{"status":"ok","database":"connected"}`.

Para una build de producción:

```bash
npm run build
npm start
```

## 5. Credenciales del administrador

El seed crea el administrador con estos valores por defecto:

| Campo | Valor |
|---|---|
| Correo | `admin@cospace.com` |
| Contraseña | `Admin123456` |
| Rol | `ADMIN` |

Si definiste `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el `.env`, las credenciales son esas. El rol `ADMIN` **solo se crea por seed**: el registro público siempre asigna el rol `USER`.

## 6. Ejecución con Docker

El `Dockerfile` construye la aplicación en varias etapas y ejecuta el servidor de Next.js en modo `standalone`. Las migraciones y el seed se ejecutan contra la base de datos desde el host, porque la imagen solo levanta el servidor.

**Construir la imagen**

```bash
docker build -t cospace .
```

**Correr el contenedor**

```bash
docker run --rm -p 3000:3000 --env-file .env cospace
```

La aplicación queda en [http://localhost:3000](http://localhost:3000). El `--env-file .env` es obligatorio: la imagen no lleva credenciales dentro, así que `DATABASE_URL` y `JWT_SECRET` se inyectan en el arranque.

La primera vez, aplica las migraciones y el seed desde el host (con tus dependencias instaladas):

```bash
npm run db:migrate
npm run db:seed
```

Si usas una base de datos local de Docker en lugar de Supabase, apunta `DATABASE_URL` y `DIRECT_URL` a ese contenedor y usa `host.docker.internal` en lugar de `localhost` para que el contenedor alcance la base.

## 7. Scripts disponibles

| Script | Comando | Qué hace |
|---|---|---|
| `npm run dev` | `next dev` | Levanta el servidor de desarrollo en el puerto 3000. |
| `npm run build` | `next build` | Compila la aplicación para producción. |
| `npm start` | `next start` | Sirve la build de producción ya compilada. |
| `npm run lint` | `eslint` | Analiza el código con las reglas de Next.js y de React. |
| `npm run db:migrate` | `prisma migrate deploy` | Aplica las migraciones pendientes a la base de datos. |
| `npm run db:seed` | `prisma db seed` | Ejecuta el seed declarado en `prisma.config.ts`. |
| `npm run seed` | `tsx prisma/seed.ts` | Ejecuta el seed directamente, sin pasar por el CLI de Prisma. |
| `npm run postinstall` | `prisma generate` | Genera el cliente de Prisma; se ejecuta solo tras `npm install`. |
| `npm run skills:sync` | `prisma skills sync` | Comando de Prisma 8 para sincronizar skills de agentes. Con Prisma 7 instalado no hace nada. |

## 8. Estructura de carpetas

```
cospace/
├── prisma/
│   ├── migrations/          Migraciones SQL aplicadas a la base de datos
│   ├── schema.prisma        Modelos User, Space, Reservation y RefreshToken
│   └── seed.ts              Administrador y espacios de ejemplo
├── public/                  Archivos estáticos
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        Registro, login, refresh, logout y sesión actual
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   └── register/route.ts
│   │   │   ├── health/db/route.ts        Comprobación de conexión
│   │   │   ├── reservations/route.ts     Listar propias y crear
│   │   │   ├── reservations/[id]/route.ts   Cancelar
│   │   │   ├── spaces/route.ts           Catálogo público
│   │   │   └── spaces/[id]/route.ts      Desactivar (solo administrador)
│   │   ├── layout.tsx       Root layout
│   │   ├── page.tsx         Home
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── spaces/page.tsx  Catálogo con filtro por tipo
│   │   └── reservations/    Mis reservas y formulario de reserva
│   ├── generated/prisma/    Cliente generado por Prisma (no versionado)
│   └── lib/
│       ├── auth.ts           Firma y verificación de tokens, opciones de cookie
│       ├── booking-rules.ts  Reglas de negocio de reservas y cancelación
│       └── prisma.ts         Instancia única del cliente de Prisma
├── .env.example             Plantilla de variables de entorno
├── Dockerfile               Imagen de producción
├── eslint.config.mjs
├── next.config.ts
├── prisma.config.ts         Configuración del CLI: esquema, migraciones y seed
└── tsconfig.json
```

## 9. API y reglas de negocio

### Endpoints

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Crea un usuario con rol `USER` y abre la sesión. |
| `POST` | `/api/auth/login` | Público | Valida credenciales y entrega las cookies de sesión. |
| `POST` | `/api/auth/refresh` | Sesión | Rota el refresh token y emite un access token nuevo. |
| `POST` | `/api/auth/logout` | Sesión | Revoca el refresh token y borra las cookies. |
| `GET` | `/api/auth/me` | Sesión | Devuelve el usuario de la sesión. |
| `GET` | `/api/spaces` | Público | Lista espacios activos; admite `type`, `startAt` y `endAt`. |
| `DELETE` | `/api/spaces/:id` | Administrador | Desactiva un espacio sin eliminarlo. |
| `GET` | `/api/reservations` | Sesión | Lista las reservas propias. |
| `POST` | `/api/reservations` | Sesión | Crea una reserva con el precio calculado en el servidor. |
| `PATCH` | `/api/reservations/:id` | Sesión o administrador | Cancela una reserva. |
| `GET` | `/api/health/db` | Público | Comprueba la conexión con la base de datos. |

Las respuestas de error usan siempre `{ "error": "mensaje" }` (con `details` cuando el fallo es de validación) y los códigos `400`, `401`, `403`, `404` y `409`.

### Reglas de negocio

Las reglas se validan en el backend. Las funciones puras viven en `src/lib/booking-rules.ts` y lo que depende de datos se valida dentro de la transacción del route handler.

| # | Regla | Cómo se garantiza |
|---|---|---|
| 1 | La reserva dura entre 1 y 4 horas, en horas completas | `validateBookingSlot` exige minuto y segundo en cero y una duración entera de 1 a 4 horas; además hay un `CHECK` en la base de datos |
| 2 | Solo se puede reservar entre las 07:00 y las 21:00 | `validateBookingSlot` evalúa la hora de Colombia (`America/Bogota`) del inicio y del fin, y descarta los rangos que cruzan la medianoche |
| 3 | No se puede reservar en el pasado ni con más de 30 días de anticipación | `validateBookingSlot`: el inicio debe ser futuro y como máximo 30 días después |
| 4 | Un espacio no puede tener dos reservas confirmadas solapadas | Comprobación dentro de la transacción más una constraint `EXCLUDE` de PostgreSQL con rango semiabierto `[)`, que permite reservas contiguas |
| 5 | Un usuario no puede tener dos reservas confirmadas solapadas, ni en espacios distintos | Comprobación dentro de la transacción (con la fila del usuario bloqueada) más otra constraint `EXCLUDE` sobre las reservas del usuario |
| 6 | Un usuario puede tener máximo 3 reservas futuras confirmadas | Conteo dentro de la transacción, después de bloquear la fila del usuario; responde `409` |
| 7 | No se puede reservar un espacio desactivado | El route handler valida `isActive` dentro de la transacción y responde `404` |
| 8 | El precio total lo calcula el servidor (horas × precio por hora) | `totalPrice` se calcula con `Prisma.Decimal` en el backend; el valor que envíe el cliente se ignora |
| 9 | Solo el dueño o un administrador pueden cancelar una reserva | El `PATCH` permite al dueño o a un usuario con rol `ADMIN`; a cualquier otro le responde `404` para no revelar que la reserva existe |
| 10 | El usuario puede cancelar hasta 2 horas antes del inicio | Se compara el momento actual con el inicio menos 2 horas; fuera de ese margen responde `409`. El administrador puede cancelar hasta que la reserva comience |
| 11 | Cancelar cambia el estado; el registro no se elimina | Se actualiza `status` a `CANCELLED` y se registra `cancelledAt`; la fila permanece |
| 12 | Un espacio no se elimina, se desactiva, y los inactivos no aparecen en el catálogo | `DELETE /api/spaces/:id` pasa `isActive` a `false` y el catálogo filtra por `isActive` |
| 13 | No se puede desactivar un espacio con reservas futuras confirmadas | El endpoint cuenta las reservas confirmadas que aún no terminan y responde `409` |
| 14 | Un usuario no puede ver ni modificar reservas de otro | Todas las consultas de reservas filtran por el usuario de la sesión, incluso si se cambia el id en la URL |

## 10. Despliegue

- **Base de datos:** PostgreSQL en Supabase (la cadena de conexión vive en `DATABASE_URL`).
- **Aplicación:** pendiente de desplegar en Vercel.

Una vez desplegada, la URL pública es:

```
PENDIENTE
```

Para desplegarla en Vercel: importa el repositorio, define las mismas variables de entorno del punto 3 en **Settings → Environment Variables** (incluido `ADMIN_PASSWORD`) y despliega. Después aplica las migraciones y el seed contra la base de datos de producción con `npm run db:migrate` y `npm run db:seed` usando el `.env` apuntando a Supabase.
