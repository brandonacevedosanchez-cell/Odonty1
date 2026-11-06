# Funcionalidades pendientes e inconsistencias encontradas

Esta lista describe brechas frente al código presente; no implica que el backend ya tenga una solución. Los trabajos futuros se formulan como recomendaciones y no como funcionalidades existentes.

## Pendiente o parcial en el frontend

| Área | Estado | Hallazgo |
| --- | --- | --- |
| Modo de demostración | PARCIAL | `PREVIEW_MODE = true`; sesión demo, usuarios y auditoría estáticos, operaciones de escritura bloqueadas o API omitida. No es una sesión real. |
| Autenticación | PARCIAL | Flujos de login, MFA, refresh, logout y cambio de contraseña están implementados en código; preview los desvía y el backend no se verificó. |
| Usuarios | PARCIAL | Servicios y validaciones existen, pero la vista actual es de solo lectura y consume registros ficticios. |
| Clínicas | PARCIAL | Registro y revisión tienen formulario/servicios. La lista requiere desactivar preview; no se comprobó servidor ni el envío multipart real. |
| Autorización | PARCIAL | Matriz estática; bypass no estricto activo y el control backend no se inspeccionó. |
| Módulos clínicos | PARCIAL | Interfaz prototipo, sin llamadas ni persistencia; modelos, rutas, campos y permisos del backend no están descritos en el frontend. |
| Recuperación y configuración de MFA | PENDIENTE | No se encontraron pantallas/llamadas frontend; el README las menciona como pendientes. |
| Edición de perfil | PENDIENTE | La configuración presenta datos en modo lectura; el texto indica que el backend no permite editarlos. |
| Activar/desactivar usuarios y reenviar contraseña temporal | PENDIENTE | El README indica que aún no existen en backend; no se hallaron controles/servicios frontend. |
| Notificaciones funcionales, facturación y pagos | PENDIENTE | Solo vistas sin datos ni endpoints. |

## Observaciones técnicas que requieren atención

1. **Vista previa siempre activa:** impide que la navegación habitual ejerza o pruebe la autenticación real, las consultas de usuarios/auditoría y el cambio de contraseña. El modo está fijado en código, no mediante variable de entorno.
2. **Texto de conexión posiblemente engañoso:** `HomePage` presenta usuarios/roles como «Conectado al backend» mientras el modo preview utiliza muestras y no llama al backend para esas listas. La etiqueta no refleja el estado de ejecución.
3. **Bypass de permisos:** los guards no estrictos aceptan cualquier permiso conocido para cualquier usuario autenticado con el bypass activo. Debe confirmarse el diseño final y dejar la autorización real en backend.
4. **Campos de paciente sin clave válida:** en `PatientsPage.jsx`, los elementos de `PATIENT_FIELDS` solo declaran `label` y `type`, pero el renderizado usa `key={field.name}`. Eso produce claves React indefinidas/no únicas al mostrar el formulario y puede generar advertencias. No bloquea la visualización, pero conviene corregirlo al implementar el formulario.
5. **Contrato no verificable desde este directorio:** el README menciona `Contrato_API_Odonty.docx`, pero ese documento no forma parte del inventario de archivos de la carpeta frontend inspeccionada. No se certifican estructuras del backend a partir de esa mención.
6. **Pruebas no cubren la navegación visual completa:** las pruebas encontradas cubren cliente API, validadores, errores y permisos; no se encontró suite de componentes/integración de páginas.
7. **No se configuró lint/type-check:** no hay scripts de lint o comprobación de tipos en `package.json`; el código es JavaScript/JSX.

## Información por confirmar con backend

- Contratos exactos de login, MFA, perfil actual, tokens y rotación.
- Esquemas de usuarios y respuestas de auditoría.
- Estados y modelo de clínica; reglas de NIT, archivos y revisión.
- Si existen endpoints de recuperación de contraseña o administración MFA y cuál es su estado.
- Recursos, modelos, validaciones, estados, paginación, permisos y trazabilidad para pacientes, citas, historia clínica, odontograma, facturación y notificaciones.
- CORS para los orígenes de desarrollo/despliegue.
- Alcance real de bloqueo por intentos, expiración MFA y cierre de sesiones, aspectos que el cliente describe pero no puede validar.

## Recomendaciones (no son funciones implementadas)

- Acordar contratos y permisos con backend antes de conectar módulos clínicos o financieros.
- Mantener explícito un perfil de preview separado de la experiencia integrada para evitar confundir muestras con datos reales.
- Probar login, permisos y endpoints contra un backend de desarrollo autorizado una vez estén disponibles sus contratos.
- Al implementar los formularios clínicos, reemplazar campos ilustrativos por campos acordados y validación tanto del cliente como del servidor.
