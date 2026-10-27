# 03 — Arquitectura propuesta

## 1. Enfoque
Aplicación fullstack en un único proyecto Next.js 16 con App Router. Las páginas renderizan la interfaz y los Route Handlers ofrecen la API propia. PostgreSQL en Supabase es la fuente de persistencia.

## 2. Estructura de carpetas propuesta
```text
src/
  app/
    (public)/
      page.tsx
      spaces/
        page.tsx
        [id]/
          page.tsx
      layout.tsx
    (auth)/
      login/
        page.tsx
      register/
        page.tsx
      layout.tsx
    (private)/
      dashboard/
        page.tsx
      layout.tsx
    (admin)/
      admin/
        page.tsx
      layout.tsx
    api/
      auth/
        register/route.ts
        login/route.ts
        refresh/route.ts
        logout/route.ts
      spaces/route.ts
      spaces/[id]/route.ts
      reservations/route.ts
      reservations/[id]/cancel/route.ts
  components/
    ui/
    layout/
    spaces/
    reservations/
  lib/
    auth/
    db/
    validation/
    errors/
    i18n/
  services/
  types/
prisma/                 # si se confirma Prisma
  schema.prisma
  migrations/
  seed.ts
proxy.ts                # ubicación final según convenciones de Next.js 16
Dockerfile
.env.example
README.md
```

Esta es una organización sugerida, no un requisito literal del instructivo. Ajustar las rutas de archivos a las convenciones exactas de Next.js 16 antes de crear el proyecto. Los route groups no deben cambiar la URL pública.

## 3. Responsabilidad por capa
- **Páginas/layouts:** composición de interfaz y estrategia de renderizado solicitada.
- **Componentes compartidos:** navegación, pie de página, botones, campos, tarjetas, estados de carga y mensajes.
- **Route Handlers:** entrada HTTP, validación, autenticación/autorización, códigos de estado y respuesta.
- **Servicios de negocio:** reglas de reservas, cálculo de precios, cancelaciones y gestión de espacios.
- **Acceso a datos/ORM:** consultas y transacciones.
- **Esquemas de validación:** contratos de entrada compartidos cuando resulte apropiado.
- **Proxy:** comprobación temprana y redirección de navegación; no reemplaza la autorización del backend.

## 4. Estrategias de renderizado obligatorias
- Home: SSG.
- Catálogo y detalle: SSR.
- Dashboard de reservas: CSR.

Documentar en el código cómo se cumple cada estrategia y evitar que la elección de renderizado contradiga los requisitos.

## 5. Flujos críticos
### Crear reserva
Interfaz → Route Handler → autenticar usuario → validar entrada → cargar espacio/precio → validar horario, anticipación, duración, solapamientos y límite de reservas → persistir de forma consistente → responder con la reserva.

### Cancelar reserva
Interfaz → Route Handler → autenticar → cargar reserva y propietario → verificar permiso y ventana de cancelación → cambiar estado a cancelada → responder.

### Operación de administrador
Interfaz admin → Route Handler → autenticar → comprobar rol en servidor → validar datos → crear/editar/desactivar espacio, respetando reservas futuras.

## 6. Consistencia de API
Propuesta de respuesta de error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La solicitud no es válida."
  }
}
```
El formato final debe mantenerse consistente; evitar enviar trazas o detalles sensibles.
