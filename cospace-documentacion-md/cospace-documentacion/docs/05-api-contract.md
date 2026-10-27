# 05 — Contrato de API (borrador)

Los nombres y payloads de este documento son una propuesta inicial. Confirmarlos al definir el esquema de datos y la validación.

## Convención de errores
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "La operación entra en conflicto con el estado actual."
  }
}
```

## Autenticación
| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Crear usuario con rol normal |
| POST | `/api/auth/login` | Público | Validar credenciales y establecer cookies |
| POST | `/api/auth/refresh` | Refresh token válido | Renovar access token |
| POST | `/api/auth/logout` | Sesión | Revocar refresh token y limpiar cookies |

## Espacios
| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| GET | `/api/spaces` | Público | Listar espacios activos |
| GET | `/api/spaces/[id]` | Público | Obtener detalle de un espacio activo |
| POST | `/api/spaces` | Admin | Crear espacio |
| PATCH | `/api/spaces/[id]` | Admin | Editar espacio |
| PATCH | `/api/spaces/[id]/deactivate` | Admin | Desactivar espacio |

El método y la ruta final para desactivar pueden cambiar, pero la operación no debe eliminar físicamente el espacio.

## Reservas
| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| GET | `/api/reservations` | Usuario autenticado | Listar solo las reservas propias |
| POST | `/api/reservations` | Usuario autenticado | Crear reserva |
| PATCH | `/api/reservations/[id]/cancel` | Propietario o admin | Cancelar reserva |

## Validaciones de reserva
El cliente envía el identificador del espacio y el intervalo solicitado; el servidor obtiene el precio y calcula el total. Validar duración, horario, pasado/anticipación, solapamientos, límite de reservas, estado del espacio y permiso de cancelación.

## Códigos HTTP esperados
- `200`: lectura o actualización correcta.
- `201`: recurso creado.
- `400`: entrada inválida.
- `401`: no autenticado.
- `403`: no autorizado por rol/propiedad.
- `404`: recurso inexistente.
- `409`: conflicto de reglas de negocio.
- `500`: error inesperado, con mensaje genérico.

## Pendientes antes de implementar
- Definir campos exactos de request/response.
- Definir paginación/filtros solo si el tiempo lo permite.
- Acordar si el detalle de un espacio desactivado responde 404.
- Especificar política de expiración y rotación del refresh token.
