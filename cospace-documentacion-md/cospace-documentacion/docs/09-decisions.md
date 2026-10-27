# 09 — Registro de decisiones técnicas

Usar este documento para registrar decisiones reales y explicar el porqué durante la sustentación. No presentar propuestas como si ya estuvieran implementadas.

## ADR-001 — Arquitectura fullstack
- **Estado:** propuesta.
- **Decisión:** un único proyecto Next.js 16 con App Router, páginas y Route Handlers.
- **Motivo:** coincide con el enunciado y reduce complejidad de despliegue.
- **Alternativa descartada:** backend separado, porque no es necesario para los requisitos y agrega configuración.

## ADR-002 — Persistencia
- **Estado:** obligatorio el motor; ORM pendiente.
- **Decisión:** PostgreSQL en Supabase.
- **ORM propuesto:** Prisma.
- **Motivo:** esquema, migraciones y seed en un flujo integrado.

## ADR-003 — Validación
- **Estado:** propuesta.
- **Decisión propuesta:** Zod para validar datos externos en Route Handlers.
- **Motivo:** validación explícita y buen soporte de TypeScript.

## ADR-004 — Sesión
- **Estado:** requisitos obligatorios; implementación pendiente.
- **Decisión:** access y refresh tokens en cookies `httpOnly`, `secure`, `sameSite`; refresh token hasheado en DB y revocado al cerrar sesión.
- **Motivo:** sigue el instructivo y evita exponer tokens al JavaScript de la página.

## ADR-005 — Autorización
- **Estado:** obligatorio.
- **Decisión:** comprobar sesión, rol y propiedad dentro de cada Route Handler protegido; usar `proxy.ts` como protección adicional de navegación.
- **Motivo:** la protección del proxy por sí sola no es suficiente según el enunciado.

## ADR-006 — Intervalos de reserva
- **Estado:** propuesta de modelado.
- **Decisión:** representar las reservas como intervalos `[inicio, fin)` y conservar cancelaciones.
- **Motivo:** permite reservas consecutivas sin considerarlas solapadas.

## ADR-007 — Alcance bajo presión de tiempo
- **Estado:** propuesta.
- **Decisión:** priorizar flujos completos y reglas de backend antes de extras visuales.
- **Motivo:** el assessment tiene 7 horas de reloj, incluidos 60 minutos de descanso.

## Decisiones por cerrar antes de programar

- [x] **ORM:** Prisma.
- [x] **Librería de validación:** Zod.
- [x] **Hash de contraseñas:** `bcryptjs`. Guardar únicamente hashes de contraseñas, nunca contraseñas en texto plano.
- [x] **Biblioteca y estrategia de tokens/refresh:** `jose` para gestionar JWT. Usar access tokens de corta duración y refresh tokens de mayor duración, almacenados en cookies `httpOnly`, `secure` en producción y `sameSite`. Guardar el hash del refresh token en la base de datos y revocarlo al cerrar sesión. Verificar autenticación y permisos en cada Route Handler protegido.
- [x] **Estilos e i18n:** Tailwind CSS y shadcn/ui para la interfaz; `next-intl` para español e inglés, con selector de idioma visible.
- [x] **Zona horaria de negocio:** almacenar los instantes de reserva en UTC y utilizar `America/Bogota` como zona horaria de negocio, centralizada en la configuración. Validar los horarios permitidos según esta zona y convertir las fechas al mostrarlas.
- [x] **Estrategia contra reservas concurrentes:** realizar las validaciones de negocio en el servidor y crear las reservas mediante transacciones de base de datos. Implementar una protección contra condiciones de carrera en PostgreSQL para impedir solapamientos por espacio y usuario, respetando también el límite de tres reservas futuras confirmadas por usuario. Probar al menos una regla de negocio.
- [x] **Disponibilidad de Supabase/Vercel:** se dispone de acceso a ambas plataformas. Configurar las variables de entorno necesarias, mantener los secretos fuera de Git y documentar su configuración en `.env.example` y en el README.

### Criterios de implementación

- Mantener las dependencias registradas en `package.json` y el archivo de lock.
- No incluir credenciales reales en el repositorio.
- Crear las tablas mediante migraciones de Prisma y preparar los datos iniciales mediante un seed.
- Crear el usuario administrador mediante seed, sin permitir el registro público de administradores.
- Verificar las reglas críticas de reservas en el servidor y probarlas.
