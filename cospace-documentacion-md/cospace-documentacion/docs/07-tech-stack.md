# 07 — Stack tecnológico

## Obligatorio según el instructivo
| Área | Requisito |
|---|---|
| Framework | Next.js 16 con App Router |
| Lenguaje | TypeScript sin `any` |
| Base de datos | PostgreSQL en Supabase |
| ORM | A elección |
| API | Route Handlers de Next.js |
| Sesión | Access token y refresh token en cookies seguras |
| Imágenes | `next/image` |
| Contenerización | Dockerfile funcional |
| Hosting de app | Vercel |
| i18n | Español e inglés |

## Stack propuesto (pendiente de confirmación)
- **ORM:** Prisma, por su esquema declarativo, migraciones y seed.
- **Validación:** Zod, para validar inputs y mantener tipos inferidos.
- **Hash de contraseñas:** Argon2id o bcrypt, según compatibilidad y facilidad de despliegue.
- **Tokens:** una biblioteca mantenida compatible con el runtime elegido; revisar explícitamente el uso en Route Handlers y `proxy.ts`.
- **Estilos:** CSS Modules o Tailwind CSS; elegir una sola opción para reducir configuración.
- **i18n:** solución ligera compatible con App Router y Next.js 16, seleccionada tras revisar su configuración.
- **Pruebas:** al menos una prueba de regla de negocio si el tiempo lo permite.

Estas son recomendaciones, no requisitos extraídos del enunciado. Confirmar versiones vigentes y compatibilidad en documentación oficial antes de instalar.

## Variables de entorno
El instructivo ejemplifica:
```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

El archivo `.env.example` debe contener todas las variables que realmente use la aplicación, con valores vacíos o valores de ejemplo no secretos. Nunca incluir secretos reales.

## Criterios para decidir
- Compatibilidad con Next.js 16 y despliegue Vercel.
- Menor complejidad de configuración.
- Tipado estricto.
- Migraciones y seed reproducibles.
- Buen soporte para cookies y operaciones seguras de tokens.
- Tiempo de implementación dentro de la prueba.
