# Funcionalidades pendientes e inconsistencias encontradas

Esta lista refleja el código y el contrato Odonty API del 13 de noviembre de 2026. La integración con servicios está cubierta por pruebas locales, pero no se verificó contra el backend remoto.

## Pendiente o parcial en el frontend

| Área | Estado | Hallazgo |
| --- | --- | --- |
| Modo de demostración | PARCIAL | Se activa solo con `VITE_PREVIEW_MODE=true`; está desactivado en `.env.example`. |
| Autenticación | PARCIAL | Login, MFA, refresh rotatorio, logout y cambio forzado están implementados; falta validar el servicio remoto en ejecución. |
| Usuarios | PARCIAL | Servicios y formularios implementados; el modo preview usa registros de muestra. El frontend no ofrece el rol legado `usuario`. |
| Clínicas | PARCIAL | Registro multipart de tres PDF y revisión con enlaces a cédula, RUT y Cámara de Comercio implementados; falta validar con backend activo. |
| Autorización | PARCIAL | Matriz de roles estática; `VITE_PERMISSION_BYPASS` está desactivado por defecto y el backend sigue siendo la autoridad. |
| Módulos clínicos | PARCIAL | Pacientes, citas, historia clínica, odontograma/CUPS y notificaciones tienen servicios alineados al contrato; integración remota pendiente de prueba. |
| Facturación y pagos | PENDIENTE | No se documentan endpoints correspondientes en el contrato revisado. |
| Recuperación y configuración de MFA | PENDIENTE | No se encontraron pantallas/llamadas frontend; el README las menciona como pendientes. |
| Edición de perfil | PENDIENTE | La configuración presenta datos en modo lectura; el texto indica que el backend no permite editarlos. |
| Activar/desactivar usuarios y reenviar contraseña temporal | PENDIENTE | El README indica que aún no existen en backend; no se hallaron controles/servicios frontend. |
| Notificaciones funcionales, facturación y pagos | PENDIENTE | Solo vistas sin datos ni endpoints. |

## Observaciones técnicas que requieren atención

1. **Verificación remota pendiente:** las pruebas usan respuestas simuladas; no confirman disponibilidad, CORS ni permisos de la API desplegada.
2. **Catálogo OpenAPI histórico:** `docs/openapi.json` incluye rutas retiradas y no refleja el contrato vigente. La referencia vigente es `integracion_api.md` junto al PDF recibido; la aplicación no consulta ese JSON.
3. **Matriz de permisos estática:** documenta la navegación del frontend y no sustituye la autorización del servidor.
4. **Pruebas visuales pendientes:** no hay suite de componentes ni pruebas de navegador para los formularios y avisos clínicos.
5. **No se configuró lint/type-check:** no hay scripts de lint o comprobación de tipos; el código es JavaScript/JSX.

## Información por confirmar con backend

- CORS para los orígenes de desarrollo y despliegue, y permisos de la cuenta usada para la prueba remota.
- Si el equipo desea mantener `docs/openapi.json` como catálogo vigente, entregar una versión generada desde el contrato actualizado; ahora se conserva como histórico.
- Endpoints de facturación y pagos, aún ausentes del contrato.
- Disponibilidad de recuperación de contraseña y configuración de MFA en el backend desplegado; las rutas están en el contrato, pero no se probaron remotamente.

## Recomendaciones (no son funciones implementadas)

- Acordar contratos y permisos con backend antes de conectar módulos clínicos o financieros.
- Mantener explícito un perfil de preview separado de la experiencia integrada para evitar confundir muestras con datos reales.
- Probar login, permisos y endpoints contra un backend de desarrollo autorizado una vez estén disponibles sus contratos.
- Al implementar los formularios clínicos, reemplazar campos ilustrativos por campos acordados y validación tanto del cliente como del servidor.
