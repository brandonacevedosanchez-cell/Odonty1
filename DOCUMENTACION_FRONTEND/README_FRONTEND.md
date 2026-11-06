# Documentación técnica del frontend de Odonty

## Alcance y método

Este conjunto describe el código del frontend que se encuentra en la carpeta raíz del proyecto. No se inspeccionó ni se da por terminada ninguna funcionalidad del backend. Los datos sobre solicitudes HTTP se limitan a las llamadas encontradas en los servicios frontend.

La implementación tiene dos realidades que deben distinguirse:

- **Vista previa activa:** `src/config/preview.js` fija `PREVIEW_MODE = true`. La aplicación abre el panel con un usuario de demostración y bloquea o sustituye varias operaciones de red. Por tanto, disponer de código de integración no significa que la función esté conectada durante la ejecución actual.
- **Código de integración existente:** autenticación, usuarios, auditoría y clínicas tienen servicios que construyen solicitudes HTTP, pero el modo de vista previa impide comprobar su compatibilidad con el servidor en una ejecución normal.

La carpeta `src/modules` también contiene interfaces clínicas preliminares. Estas no consultan ni guardan datos; la interfaz lo advierte explícitamente.

## Estado general

| Área | Estado | Evidencia y límite |
| --- | --- | --- |
| Aplicación React y navegación | IMPLEMENTADA | Vite, React Router y rutas de las páginas presentes en `src/`. |
| Inicio de sesión, MFA y sesión | PARCIAL | Servicios y pantallas implementados; se encuentran desactivados en el modo de vista previa actual. |
| Gestión de usuarios | PARCIAL | Servicios y pantallas implementados; el modo actual usa registros estáticos y no permite escritura. |
| Registro/revisión de clínicas | PARCIAL | Formulario, validaciones y servicios; la revisión depende de desactivar la vista previa y del backend. |
| Roles y permisos | PARCIAL | Hay una matriz estática; no es autorización del servidor. Algunos guards usan un bypass habilitado. |
| Pacientes, citas, historia clínica, odontograma, facturación y notificaciones | PARCIAL | Prototipos de interfaz sin peticiones API ni persistencia. |
| Instalación, pruebas y compilación | IMPLEMENTADA | Scripts npm declarados; las 35 pruebas y `npm run build` se ejecutaron correctamente durante esta revisión. |

## Cómo leer el resto

- [tecnologias_y_dependencias.md](./tecnologias_y_dependencias.md): stack, bibliotecas y herramientas.
- [estructura_del_proyecto.md](./estructura_del_proyecto.md): inventario de carpetas y archivos.
- [paginas_y_componentes.md](./paginas_y_componentes.md): páginas, vistas y componentes reutilizables.
- [navegacion_y_modulos.md](./navegacion_y_modulos.md): rutas, layout y estado de los módulos.
- [integracion_api.md](./integracion_api.md): solicitudes y contratos observables desde el frontend.
- [formularios_y_validaciones.md](./formularios_y_validaciones.md): campos y reglas existentes.
- [roles_y_permisos_frontend.md](./roles_y_permisos_frontend.md): matriz representada y controles del cliente.
- [funcionalidades_pendientes.md](./funcionalidades_pendientes.md): vacíos, contradicciones y puntos por confirmar.
- [instalacion_y_ejecucion.md](./instalacion_y_ejecucion.md): ejecución local y Docker.
- [../INVENTARIO_FUNCIONALIDADES.md](../INVENTARIO_FUNCIONALIDADES.md): tabla resumida de funcionalidades y evidencia.

## Criterio de estado

- **IMPLEMENTADA:** el comportamiento está implementado en el frontend y no depende de una operación que el código aún marque como provisional. No certifica el estado del backend.
- **PARCIAL:** existe una parte funcional o una interfaz, pero falta integración, persistencia, configuración o validación.
- **PENDIENTE:** no se encontró implementación funcional en el frontend.

Donde el comportamiento del servidor no se puede inferir, se indica **PENDIENTE DE CONFIRMAR CON BACKEND**.
