# 06 — Diseño de interfaz

## 1. Dirección visual propuesta
Crear una interfaz clara, profesional y enfocada en reservar espacios con pocos pasos. La identidad visual es una decisión pendiente; priorizar consistencia, legibilidad y rapidez de implementación sobre animaciones complejas.

## 2. Páginas y contenido
### Home — SSG
- Propuesta de valor.
- Acceso al catálogo.
- Secciones breves de tipos de espacios.
- Navbar y footer públicos.

### Catálogo — SSR
- Tarjetas de espacios activos.
- Imagen, nombre, tipo y precio por hora.
- Acceso a detalle.
- Estados vacío y de error.

### Detalle — SSR
- Imagen optimizada con `next/image`.
- Descripción y precio por hora.
- Selector de fecha/hora y duración entre 1 y 4 horas.
- CTA de reserva; si no hay sesión, dirigir al login conservando el contexto cuando sea viable.

### Registro y login
- Formularios simples.
- Errores de validación visibles y accesibles.
- No mostrar ni almacenar tokens en la interfaz.

### Dashboard — CSR
- Reservas propias.
- Estado, intervalo, espacio y precio.
- Acción de cancelar solo cuando esté permitida.
- Estados de carga, error, vacío y éxito.

### Panel de administración
- Listado de espacios.
- Crear y editar.
- Desactivar, mostrando error claro si existen reservas futuras confirmadas.

## 3. Layouts exigidos
- `(public)`: navbar y footer.
- `(auth)`: diseño centrado y simple.
- `(private)`: navbar con menú de usuario.
- `(admin)`: layout propio del panel.

## 4. Componentes reutilizables
- Navbar, footer, botón, input, select, formulario, tarjeta de espacio, tarjeta/fila de reserva, alertas, indicador de carga y confirmación de cancelación.
- Evitar duplicar validaciones de negocio en UI como sustituto de la validación backend.

## 5. Responsive y accesibilidad
- Diseño usable en móvil y escritorio.
- Etiquetas asociadas a campos, foco visible y mensajes de error legibles.
- No depender únicamente del color para comunicar estados.

## 6. i18n e hidratación
- Interfaz disponible en español e inglés con selector visible.
- Mantener las traducciones organizadas y evitar cadenas duplicadas dispersas.
- Para un componente con fecha/hora local del cliente, evitar diferencias entre HTML del servidor y primera renderización del cliente; mostrar el dato local tras montar o usar una estrategia compatible.

## 7. Decisiones pendientes
- Paleta, tipografía, librería de componentes y estrategia i18n.
- Campos definitivos del formulario de espacio.
- Formato de fecha, moneda y zona horaria.
