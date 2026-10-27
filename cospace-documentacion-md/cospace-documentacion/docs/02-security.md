# 02 — Seguridad

## 1. Principios
- Denegar por defecto las operaciones protegidas.
- Validar y autorizar cada operación en el servidor.
- No confiar en IDs, roles, precios ni estados enviados por el cliente.
- No exponer tokens ni secretos en respuestas, logs o repositorio.
- Mantener historial de reservas canceladas.

## 2. Contraseñas y sesión
- Guardar contraseñas usando un algoritmo de hash apropiado para contraseñas.
- Emitir access token y refresh token en cookies `httpOnly`, `secure` y `sameSite`.
- No almacenar tokens en `localStorage` ni devolverlos en el body.
- Guardar el hash del refresh token en la base de datos.
- En logout, revocar el refresh token.
- Implementar renovación del access token.
- Los secretos se obtienen desde variables de entorno; no se escriben en el código.

## 3. Autorización
- Las rutas privadas requieren sesión válida.
- Las rutas de administración requieren rol administrador.
- Los Route Handlers repiten las comprobaciones necesarias; `proxy.ts` es una capa adicional, no la única barrera.
- Para reservas, filtrar por el usuario autenticado en el servidor.
- Permitir cancelar únicamente al propietario o administrador, respetando la regla de cancelación para el usuario común.

## 4. Validación y errores
- Validar cuerpo, parámetros, fechas, horas, IDs y campos permitidos.
- Calcular el precio en servidor.
- Usar errores coherentes:
  - `400`: entrada inválida.
  - `401`: falta autenticación o sesión válida.
  - `403`: autenticado, pero sin permiso.
  - `404`: recurso inexistente o no accesible según la política elegida.
  - `409`: conflicto de disponibilidad, solapamiento o límite de reservas.
- No incluir detalles internos, secretos ni trazas en respuestas de producción.

## 5. Riesgos principales y controles
| Riesgo | Control mínimo |
|---|---|
| Acceso a reservas ajenas (IDOR) | Consultas acotadas por usuario autenticado y autorización en cada handler |
| Escalada de privilegios | El rol admin solo se crea por seed; el cliente no puede asignárselo |
| Precio manipulado | Cálculo en servidor usando el precio persistido |
| Doble reserva concurrente | Comprobación de conflictos en backend y estrategia transaccional/consistente |
| Reutilización de refresh token | Hash persistido, expiración y revocación |
| Fuerza bruta en login | Extra opcional: rate limiting |
| Secretos filtrados | `.env` fuera de Git; `.env.example` solo con nombres y valores vacíos |
| Cambios no autorizados | Validación de propiedad/rol antes de mutaciones |

## 6. Decisión pendiente importante
La protección contra dos reservas concurrentes debe diseñarse de forma que no dependa exclusivamente de una comprobación visual o una validación previa no atómica. Elegir y documentar la estrategia compatible con el ORM y PostgreSQL antes de implementar.

## 7. Revisión de seguridad antes de entregar
- [ ] Tokens ausentes de localStorage y bodies.
- [ ] Cookies configuradas correctamente para el entorno.
- [ ] Refresh token persistido como hash y revocado en logout.
- [ ] Autorización dentro de cada Route Handler protegido.
- [ ] Prueba manual de acceso a reserva ajena.
- [ ] Validación de rol admin en servidor.
- [ ] Precios calculados por el servidor.
- [ ] No hay secretos reales en GitHub ni en archivos de entrega.
