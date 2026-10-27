# 10 — Pruebas, configuración y entrega

## 1. Casos críticos de prueba manual
### Reservas
- [ ] Rechazar duración inferior a 1 hora o superior a 4.
- [ ] Rechazar intervalos que no sean horas completas.
- [ ] Rechazar inicio antes de las 07:00 o fin después de las 21:00.
- [ ] Rechazar fechas pasadas y fechas a más de 30 días.
- [ ] Permitir reservas consecutivas sin solapamiento.
- [ ] Rechazar solapamiento del mismo espacio.
- [ ] Rechazar solapamiento del mismo usuario en otro espacio.
- [ ] Rechazar la cuarta reserva futura confirmada.
- [ ] Rechazar reservas de espacios desactivados.
- [ ] Verificar que el total lo calcula el servidor.
- [ ] Rechazar cancelación fuera de la ventana permitida para usuario.
- [ ] Confirmar que cancelar cambia el estado y no borra el registro.
- [ ] Impedir desactivar espacios con reservas futuras confirmadas.

### Seguridad
- [ ] Un usuario no puede consultar ni modificar reservas ajenas manipulando el ID.
- [ ] Un usuario normal no puede acceder a operaciones admin.
- [ ] El registro público no permite asignarse rol admin.
- [ ] Los tokens no aparecen en el body ni en localStorage.
- [ ] Logout revoca refresh token.
- [ ] Los handlers protegidos validan sesión y rol.

### Entrega
- [ ] Migraciones aplican desde una base limpia.
- [ ] Seed crea administrador y espacios de ejemplo.
- [ ] `.env.example` incluye todas las variables usadas y no tiene secretos reales.
- [ ] README permite ejecutar el proyecto desde cero.
- [ ] Dockerfile construye y ejecuta la app.
- [ ] Despliegue en Vercel probado.
- [ ] Repositorio público de GitHub.
- [ ] TXT con el enlace al repositorio.
- [ ] ZIP del proyecto.
- [ ] Revisar que los commits estén dentro de la fecha límite.

## 2. Variables de entorno
El enunciado muestra `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN` y `REFRESH_TOKEN_EXPIRES_IN`. Añadir cualquier otra variable realmente necesaria y explicar todas en el README.

## 3. README definitivo debe incluir
1. Descripción del proyecto.
2. Requisitos previos y versiones.
3. Explicación de cada variable y cómo obtenerla/generarla.
4. Comandos exactos, en orden: clonar, instalar, configurar env, migrar, seed y ejecutar.
5. Credenciales del administrador creado por seed.
6. Comandos Docker y paso de variables.
7. Scripts de `package.json`.
8. Estructura de carpetas.
9. URL desplegada.

## 4. Política de IA e integridad
La documentación de planificación puede utilizarse como apoyo. Durante el assessment, el coder debe escribir, comprender, verificar y poder defender su implementación; no usar IA para reemplazar la resolución individual ni copiar soluciones completas. Consultar las reglas completas del documento original.
