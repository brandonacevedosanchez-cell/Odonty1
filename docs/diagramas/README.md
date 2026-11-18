# Diagramas de navegación (Archify)

Diagramas de la navegación del frontend Odonty generados con [Archify](https://github.com/tt-a1i/archify) (workflow schema v2). Cada `.workflow.json` es la fuente; el `.workflow.html` es el artefacto renderizado y verificable.

## Contenido

| Archivo | Qué representa |
| --- | --- |
| `navegacion-odonty.workflow.html` | Mapa general: acceso público, sesión y secciones del área autenticada. |
| `guards-y-excepciones.workflow.html` | `ProtectedRoute`, `GuestRoute`, `RequirePermission`, cambio forzado, cierre de sesión, acceso denegado y 404. |
| `navegacion-odonty-resumen.workflow.html` | Versión corta para diapositivas, agrupada por públicas, sesión, administración, módulos clínicos y redirecciones de seguridad. |
| `acceso-login.workflow.html` | Login, MFA y `GET /auth/me`. |
| `acceso-recuperacion.workflow.html` | Recuperación de contraseña en dos pasos. |
| `acceso-registro.workflow.html` | Registro público de clínica. |
| `cambio-contrasena.workflow.html` | Cambio forzado o voluntario y cierre global de sesión. |
| `administracion-usuarios.workflow.html` | Listado, alta, edición, rol y estado de usuarios. |
| `administracion-roles.workflow.html` | Matriz estática de permisos y reglas de asignación. |
| `administracion-auditoria.workflow.html` | Consulta del registro de auditoría. |
| `administracion-clinicas.workflow.html` | Registro público y revisión de clínicas. |
| `pacientes.workflow.html` | Directorio, alta, ficha, alertas y edición. |
| `citas.workflow.html` | Agenda, creación, reprogramación, cancelación y estado. |
| `historia-clinica.workflow.html` | Consulta, registro y detalle paginado. |
| `odontograma.workflow.html` | Paciente, pieza FDI, búsqueda CUPS, hallazgos e historial. |
| `facturacion.workflow.html` | Marcador de integración pendiente (sin API). |
| `notificaciones.workflow.html` | Filtro, listado, lectura y creación. |

La estructura se define en `tools/gen-workflows.mjs` a partir de `src/routes/AppRoutes.jsx`, `src/routes/guards.jsx`, `src/routes/navigation.js`, `src/layouts/` y los módulos y servicios de `src/`.

## Requisitos

- Node.js 18 o superior.
- Archify 3.2.0. El proyecto no lo incluye como dependencia; hay que clonarlo o indicar su ruta.

## Localizar Archify

`tools/render-workflows.mjs` busca el CLI en este orden:

1. `ARCHIFY_BIN` (ruta al archivo `bin/archify.mjs`).
2. `node_modules/archify/bin/archify.mjs`.
3. `docs/diagramas/tools/archify/bin/archify.mjs`.
4. `../archify/archify/bin/archify.mjs` (repo hermano).

La opción recomendada es clonar Archify dentro de `docs/diagramas/tools/`:

```bash
git clone https://github.com/tt-a1i/archify.git docs/diagramas/tools/archify
```

También puedes clonarlo en cualquier carpeta y usar la variable de entorno:

```powershell
$env:ARCHIFY_BIN = "C:\ruta\a\archify\bin\archify.mjs"
```

No se usan rutas fijas de `AppData` ni carpetas temporales. `docs/diagramas/tools/archify/` está ignorado por git.

## Regenerar

```bash
npm run diagrams:generate   # crea/actualiza los .workflow.json
npm run diagrams:render     # valida y renderiza los .workflow.html con Archify
npm run diagrams            # ambos pasos
```

`diagrams:render` ejecuta, por cada archivo:

```bash
node <archify>/bin/archify.mjs finalize workflow \
  docs/diagramas/<nombre>.workflow.json \
  docs/diagramas/<nombre>.workflow.html \
  --quality showcase --json \
  --out-dir docs/diagramas/receipts
```

Para un solo diagrama:

```bash
node docs/diagramas/tools/render-workflows.mjs --only odontograma
```

Los recibos (`receipts/`, `*.finalize*.json`, `*.browser-check.json`, `*.delivery.json`) son evidencia efímera y están ignorados por git. El `.delivery.json` se escribe junto al HTML; por eso también se ignora.

## Exportar para diapositivas

```bash
npm run diagrams:export
```

Genera en `docs/diagramas/export/`:

- `navegacion-odonty-resumen.png`
- `navegacion-odonty-resumen.svg`
- `navegacion-odonty-resumen.pdf`

El script usa Chrome o Edge en modo headless (`BROWSER_BIN` para indicar otro ejecutable), abre el HTML con `?theme=light&embed=1` para obtener la paleta azul/blanco sin toolbar, y extrae el SVG con sus estilos. Opciones: `--width 1800` y `--scale 2`.

## Reglas de Archify y límites

- `schema_version` debe ser `2` y `meta.output` una ruta POSIX relativa.
- Las columnas van de `0` a `5` (máximo seis).
- `mainPath` debe ser una secuencia de nodos conectados por aristas consecutivas.
- Cada grupo necesita al menos un nodo y un carril válido.
- En `--quality showcase` fallan los cruces en X, los solapamientos de rutas de 8 px o más y las etiquetas más anchas que el nodo. Si una etiqueta no cabe, se acorta o se aumenta `width`.
- `--out-dir` mueve los recibos de `browser-check` y `finalize`, pero el `*.delivery.json` queda junto al HTML.

### Aristas que no se dibujan y por qué

- **Acceso denegado y 404:** no son cambios de URL. `RequirePermission` devuelve `ForbiddenPage` en la misma ruta y el 404 es la ruta `*` dentro de `AppLayout`. Se representan como nodos terminales, no como navegación.
- **Cierre de sesión:** se dibuja desde la topbar hacia login en `guards-y-excepciones`; no se repite en cada módulo.
- **Módulos clínicos en el mapa general:** el sidebar enlaza seis rutas; para evitar cruces se agrupan en un nodo con grupo y el detalle vive en cada diagrama de módulo.
- **Llamadas auxiliares:** `GET /patients/check`, `GET /patients/{id}/alerts`, `GET /users`, `GET /appointments?patient_id=…` y `GET /catalogs/cups/{code}` se documentan en las tarjetas del diagrama en lugar de crear una arista por llamada, porque comparten columna y cruzarían el flujo principal. Todas están listadas en `DOCUMENTACION_FRONTEND/navegacion_y_modulos.md`.
- **Configuración:** `/configuracion` se abre desde el menú de la topbar; se menciona en la tarjeta de cuenta y no como arista del flujo principal.

## Estado real de la integración

- **Facturación** no tiene endpoint financiero: la pantalla muestra un aviso y no llama a la API.
- **Roles** es una matriz estática (`ROLE_PERMISSIONS`); no existe un endpoint de permisos.
- **Odontograma** sí consulta `GET /catalogs/cups?dental_only=false` para buscar CUPS y `GET /catalogs/cups/{code}` para el detalle.
- El modo vista previa (`VITE_PREVIEW_MODE`) solo afecta a Usuarios, Auditoría y al bootstrap de autenticación; los módulos clínicos llaman a la API.
