# 01 — Requisitos y criterios de aceptación

## 1. Objetivo
Construir CoSpace, una aplicación fullstack de reservas de espacios de coworking. La información de la aplicación debe persistir en una base de datos propia y servirse mediante Route Handlers de Next.js; no se permite consumir una API externa para obtener los datos de negocio.

## 2. Roles
### Usuario
- Registrarse e iniciar sesión.
- Consultar el catálogo público y el detalle de un espacio.
- Crear reservas.
- Consultar y cancelar sus propias reservas.

### Administrador
- Disponer de las capacidades de usuario.
- Crear, editar y desactivar espacios.
- La cuenta de administrador se crea mediante seed; no mediante registro público.

## 3. Páginas mínimas
- Home.
- Catálogo de espacios.
- Detalle de espacio mediante ruta dinámica `[id]`.
- Registro.
- Login.
- Dashboard de mis reservas.
- Panel de administración.

## 4. Reglas de reserva
1. Duración de 1 a 4 horas completas.
2. Horario permitido: de 07:00 a 21:00.
3. No reservar en el pasado ni con más de 30 días de anticipación.
4. No permitir solapamientos entre reservas confirmadas del mismo espacio. Una reserva que termina a las 12:00 puede ser seguida por otra que empieza a las 12:00.
5. Un usuario no puede tener dos reservas confirmadas que se solapen, incluso si son de espacios distintos.
6. Un usuario puede tener como máximo 3 reservas futuras confirmadas.
7. No reservar espacios desactivados.
8. El servidor calcula el precio total: horas × precio por hora. El cliente no determina el precio.
9. Solo el dueño de la reserva o un administrador puede cancelarla.
10. Un usuario puede cancelar hasta 2 horas antes de la hora de inicio.
11. Cancelar cambia el estado a cancelada; no se borra el registro.

## 5. Reglas de espacios
- No se eliminan físicamente espacios: se desactivan.
- Los espacios desactivados no aparecen en el catálogo público.
- No se puede desactivar un espacio con reservas futuras confirmadas.

## 6. Seguridad de datos
Un usuario no puede ver ni modificar reservas de otro usuario, incluso manipulando el ID de la URL.

## 7. Requisitos técnicos obligatorios
- Next.js 16, App Router y TypeScript.
- Route groups `(public)`, `(auth)`, `(private)` y `(admin)`.
- Layout raíz y layout propio para cada grupo.
- SSG para Home; SSR para catálogo y detalle; CSR para dashboard de reservas.
- Route Handlers para registro, login, refresh, logout; listar/crear/editar/desactivar espacios; listar/crear/cancelar reservas.
- Validación de entradas y formato de error consistente; códigos HTTP adecuados, incluyendo 400, 401, 403, 404 y 409.
- ORM, migraciones y seed.
- PostgreSQL alojado en Supabase.
- Contraseñas hasheadas.
- Access token y refresh token en cookies `httpOnly`, `secure` y `sameSite`; nunca en `localStorage` ni en el body de la respuesta.
- Refresh token hasheado en base de datos y revocado en logout.
- Renovación de access token sin iniciar sesión otra vez.
- Cada Route Handler debe validar la sesión y el rol; no depender únicamente del proxy.
- `proxy.ts` para protección y redirección de rutas privadas/admin.
- i18n español e inglés con selector visible.
- Componente basado en dato del cliente sin errores de hidratación.
- `next/image` para imágenes de espacios.
- Dockerfile funcional; docker-compose opcional.
- `.env.example` sin secretos reales.
- README reproducible desde cero.
- Despliegue de la aplicación en Vercel.
- TypeScript sin `any`, nombres claros, responsabilidad única y sin duplicación.

## 8. Extras opcionales
- Rate limiting en login.
- Idempotencia al crear reservas.
- docker-compose.
- Pipeline CI.
- Prueba de al menos una regla de negocio.

## 9. Criterios de aceptación mínimos
- Los flujos esenciales pueden recorrerse desde la interfaz.
- Las reglas de negocio se validan en backend, no solo en el cliente.
- Los errores usan códigos HTTP y estructura consistente.
- Un usuario no accede a reservas ajenas.
- Las credenciales no se exponen al cliente.
- El proyecto puede configurarse siguiendo el README.
- El repositorio público, TXT y ZIP están preparados antes del cierre.

## 10. Restricciones del assessment
- Desarrollo individual y sin plagio.
- El coder debe poder explicar el código y las decisiones.
- El uso de IA está permitido como apoyo, pero no para sustituir la autonomía ni generar una solución completa de forma autónoma.
- Consultar las rúbricas en Moodle: no están incluidas en el documento recibido.
