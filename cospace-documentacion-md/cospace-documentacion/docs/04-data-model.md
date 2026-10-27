# 04 — Modelo de datos

## 1. Objetivo

Definir el modelo de datos de CoSpace mediante Prisma ORM y PostgreSQL en Supabase.

El modelo debe permitir gestionar usuarios, espacios de coworking, reservas y sesiones renovables, garantizando la integridad de los datos y facilitando la implementación de las reglas de negocio.

El diseño prioriza la seguridad, la claridad y una implementación realista dentro del tiempo disponible para la prueba técnica.

## 2. Entidades principales

El modelo inicial estará compuesto por cuatro entidades:

- `User`: usuarios y administradores.
- `Space`: espacios disponibles para reservar.
- `Reservation`: reservas e historial de cancelaciones.
- `RefreshToken`: sesiones renovables de autenticación.

No se añadirán entidades adicionales mientras los requisitos obligatorios puedan resolverse correctamente con este modelo.

## 3. Entidad User

Representa a los usuarios registrados en la plataforma.

| Campo | Tipo | Restricciones y propósito |
|---|---|---|
| `id` | `String` | Identificador UUID y clave primaria. |
| `name` | `String` | Nombre del usuario. |
| `email` | `String` | Correo único, normalizado a minúsculas. |
| `passwordHash` | `String` | Hash de contraseña generado con `bcryptjs`. |
| `role` | `UserRole` | Rol del usuario; por defecto, `USER`. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de última modificación. |

### Relaciones

- Un usuario puede tener muchas reservas.
- Un usuario puede tener varios registros de refresh tokens.

### Reglas

- El correo debe ser único.
- Las contraseñas nunca se almacenan en texto plano.
- El registro público siempre asigna el rol `USER`.
- El rol `ADMIN` se asigna mediante un seed controlado.
- El cliente no puede elevar sus privilegios modificando los datos enviados al servidor.

## 4. Entidad Space

Representa los espacios que pueden reservarse.

| Campo | Tipo | Restricciones y propósito |
|---|---|---|
| `id` | `String` | Identificador UUID y clave primaria. |
| `name` | `String` | Nombre del espacio. |
| `description` | `String` | Descripción del espacio. |
| `type` | `SpaceType` | Tipo de espacio. |
| `capacity` | `Int` | Capacidad, siempre mayor que cero. |
| `pricePerHour` | `Decimal` | Precio por hora, no negativo. |
| `isActive` | `Boolean` | Indica si el espacio admite nuevas reservas. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de última modificación. |

### Relaciones

- Un espacio puede tener muchas reservas históricas.

### Reglas

- Solo los administradores pueden crear, editar o desactivar espacios.
- Los espacios inactivos no admiten nuevas reservas.
- No se puede desactivar un espacio con reservas futuras confirmadas.
- Los espacios no se eliminan físicamente como parte de las operaciones administrativas ordinarias.
- Los precios se representan mediante `Decimal` para evitar los problemas de precisión de los números de punto flotante.

## 5. Entidad Reservation

Representa una reserva y conserva su historial aunque sea cancelada.

| Campo | Tipo | Restricciones y propósito |
|---|---|---|
| `id` | `String` | Identificador UUID y clave primaria. |
| `userId` | `String` | Clave foránea del usuario propietario. |
| `spaceId` | `String` | Clave foránea del espacio reservado. |
| `startAt` | `DateTime` | Instante de inicio almacenado en UTC. |
| `endAt` | `DateTime` | Instante de finalización almacenado en UTC. |
| `totalPrice` | `Decimal` | Precio total calculado en el servidor. |
| `status` | `ReservationStatus` | Estado de la reserva. |
| `createdAt` | `DateTime` | Fecha de creación. |
| `updatedAt` | `DateTime` | Fecha de última modificación. |
| `cancelledAt` | `DateTime?` | Fecha de cancelación; nulo mientras no esté cancelada. |

### Relaciones

- Cada reserva pertenece a un usuario.
- Cada reserva pertenece a un espacio.

### Reglas

- La duración debe ser de una a cuatro horas completas.
- El horario permitido es de 07:00 a 21:00, según `America/Bogota`.
- No se permiten reservas pasadas ni con más de 30 días de anticipación.
- No puede haber solapamientos entre reservas confirmadas del mismo espacio.
- Un usuario no puede tener reservas confirmadas solapadas, incluso si corresponden a espacios diferentes.
- Cada usuario puede tener como máximo tres reservas futuras confirmadas.
- No se pueden crear reservas para espacios inactivos.
- El precio total se calcula en el servidor a partir de la duración y del precio por hora.
- Solo el propietario o un administrador puede cancelar una reserva.
- El usuario solo puede cancelar hasta dos horas antes del inicio.
- Las reservas canceladas se conservan en la base de datos.
- Al cancelar una reserva, se actualizan `status` y `cancelledAt`.

### Representación temporal

Los instantes se almacenan en UTC. Las reglas relacionadas con el horario comercial se validan utilizando la zona horaria `America/Bogota`.

Se utilizarán intervalos semiabiertos: el inicio está incluido y el final excluido. Una reserva de 09:00 a 10:00 puede ir seguida de otra de 10:00 a 11:00.

Existe solapamiento cuando:

`inicioA < finB AND finA > inicioB`

El precio total se guarda en la reserva para conservar el importe calculado cuando se creó, incluso si el precio del espacio cambia posteriormente.

## 6. Entidad RefreshToken

Representa una sesión renovable de autenticación.

| Campo | Tipo | Restricciones y propósito |
|---|---|---|
| `id` | `String` | Identificador UUID y clave primaria. |
| `userId` | `String` | Clave foránea del usuario. |
| `tokenHash` | `String` | Hash del refresh token, nunca el token en texto plano. |
| `expiresAt` | `DateTime` | Fecha de expiración. |
| `revokedAt` | `DateTime?` | Fecha de revocación; nulo si no está revocado. |
| `createdAt` | `DateTime` | Fecha de creación. |

### Relaciones

- Cada refresh token pertenece a un usuario.

### Reglas

- Los refresh tokens se almacenan mediante hashes.
- Los tokens expirados o revocados no pueden utilizarse.
- La renovación debe validar el token y su estado en el servidor.
- Al cerrar sesión, se revoca el refresh token correspondiente.
- Las cookies de autenticación serán `httpOnly`, `secure` en producción y configuradas con `sameSite`.
- Los tokens no se almacenan en `localStorage` ni se devuelven en el cuerpo de las respuestas.

## 7. Enumeraciones

### UserRole

- `USER`: usuario normal.
- `ADMIN`: administrador.

### SpaceType

- `DESK`: escritorio.
- `MEETING_ROOM`: sala de reuniones.
- `BOOTH`: cabina.

### ReservationStatus

- `CONFIRMED`: reserva confirmada.
- `CANCELLED`: reserva cancelada.

No se incluirán estados adicionales como `PENDING` o `COMPLETED` inicialmente, porque no son necesarios para los requisitos obligatorios.

Una reserva pasada puede conservar el estado `CONFIRMED` como registro histórico. Para determinar si es futura, se comprobará su fecha de inicio.

## 8. Índices y restricciones de integridad

### Restricciones básicas

- `User.email`: restricción única.
- `RefreshToken.tokenHash`: restricción única.
- `Space.capacity > 0`.
- `Space.pricePerHour >= 0`.
- `Reservation.startAt < Reservation.endAt`.
- Claves foráneas para las relaciones entre usuarios, espacios, reservas y refresh tokens.

Las restricciones de capacidad, precio y orden temporal se reforzarán en PostgreSQL cuando corresponda, además de validarlas en el servidor.

### Índices recomendados

- `User.email`: índice único.
- `Reservation(userId, status, startAt)`: consultas de reservas por usuario.
- `Reservation(spaceId, status, startAt)`: consultas de disponibilidad por espacio.
- `RefreshToken.tokenHash`: índice único.
- `RefreshToken(userId)`: consulta de sesiones por usuario.

Los índices definitivos se ajustarán al esquema Prisma y a las consultas reales implementadas.

## 9. Prevención de reservas concurrentes

Una consulta de disponibilidad seguida de una inserción no garantiza que dos solicitudes simultáneas respeten las reglas de negocio.

La estrategia prevista combinará:

1. Transacciones interactivas de Prisma.
2. Nivel de aislamiento `Serializable` en las operaciones sensibles.
3. Reintentos limitados ante errores de serialización o conflictos de escritura recuperables.
4. Restricciones de integridad en PostgreSQL.
5. Validación de disponibilidad y límites dentro de la transacción.

La creación de una reserva deberá comprobar, dentro de la transacción:

- Que el espacio existe y está activo.
- Que las fechas y la duración son válidas.
- Que no existen reservas confirmadas solapadas para el espacio.
- Que el usuario no tiene reservas confirmadas solapadas.
- Que el usuario no supera el límite de tres reservas futuras confirmadas.
- Que el precio se calcula en el servidor.

Las operaciones de desactivación de espacios deberán protegerse de forma compatible con esta estrategia para evitar desactivar un espacio mientras se confirma una reserva concurrente.

### Restricción de exclusión para espacios

Se recomienda evaluar una restricción de exclusión de PostgreSQL que impida solapamientos de reservas confirmadas para el mismo espacio.

Esta restricción puede requerir tipos de rango temporal, extensiones y una migración SQL personalizada. No se asume que Prisma pueda expresar toda esta regla directamente en su esquema.

La implementación deberá comprobar la compatibilidad de la restricción con el modelo definitivo y los estados de las reservas.

La restricción de exclusión por espacio no resuelve por sí sola los solapamientos por usuario ni el límite de tres reservas. Estas reglas también necesitan protección transaccional.

### Gestión de conflictos

Los conflictos definitivos de disponibilidad o de reglas de negocio se responderán con HTTP `409 Conflict`.

Los conflictos transitorios de serialización podrán provocar un número limitado de reintentos. Si se agotan, se devolverá un error controlado, sin afirmar que la reserva se ha creado.

La estrategia debe probarse con solicitudes concurrentes reales. No se considerará garantizada únicamente por utilizar transacciones.

## 10. Borrado y conservación de registros

Las reservas canceladas se conservan para mantener el historial.

Los espacios se desactivan en lugar de eliminarse físicamente desde la administración ordinaria.

Las relaciones y políticas de borrado se definirán para evitar eliminaciones accidentales de información histórica. La eliminación de cuentas y la retención de datos no forman parte de las funcionalidades obligatorias de esta prueba.

Los refresh tokens expirados o revocados podrán limpiarse mediante una tarea de mantenimiento si queda tiempo, pero esta tarea no es un requisito inicial.

## 11. Decisiones de implementación

- ORM: Prisma.
- Base de datos: PostgreSQL en Supabase.
- Identificadores: UUID representados mediante `String` en Prisma.
- Precios: `Decimal`.
- Instantes: UTC.
- Zona horaria de negocio: `America/Bogota`.
- Autenticación: access token y refresh token.
- Contraseñas: `bcryptjs`.
- JWT: `jose`.
- Validación de entradas: Zod.
- Concurrencia: transacciones `Serializable`, reintentos limitados y restricciones de PostgreSQL.
- Cancelaciones: actualización de estado, sin borrado físico.
- Administrador inicial: seed controlado.

## 12. Criterios de aceptación

El modelo se considerará preparado para la implementación cuando:

- Las cuatro entidades estén definidas en Prisma.
- Las relaciones y enumeraciones sean válidas.
- Las migraciones se ejecuten correctamente en PostgreSQL.
- Los índices y restricciones estén definidos.
- La autenticación no requiera almacenar tokens en texto plano.
- Las reservas puedan conservarse después de una cancelación.
- La estrategia de concurrencia esté implementada y probada.
- Se compruebe que dos reservas incompatibles no pueden confirmarse simultáneamente.
- Se compruebe que un usuario no puede superar los límites de reservas mediante solicitudes concurrentes.

Este documento describe el diseño previsto. Las decisiones que requieran SQL personalizado, así como las garantías de concurrencia, deberán verificarse durante la implementación y las pruebas.
