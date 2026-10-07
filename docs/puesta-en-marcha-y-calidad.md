# Puesta en marcha y control de calidad del CRM EPSA

## Activación de acceso por usuarios

El CRM debe tener cuentas individuales. Administración gestiona el perfil público, usuarios y eliminaciones; secretaría atiende y asigna conversaciones. Las acciones de escritura autenticadas se registran en `crm_audit_logs`, con usuario, ruta, recurso, fecha y resultado. No se guardan contraseñas ni contenidos de mensajes en ese registro.

1. Desplegar el backend actualizado en Render y aplicar las migraciones pendientes en Neon (`php artisan migrate --force`) tras verificar una rama o respaldo. Esto crea el rol de usuario, las sesiones, la asignación de conversaciones y la auditoría.
2. En Render, establecer `APP_ENV=production`, `CRM_BOOTSTRAP_ADMIN_EMAIL`, `CRM_BOOTSTRAP_ADMIN_PASSWORD` (12 caracteres como mínimo) y, opcionalmente, `CRM_BOOTSTRAP_ADMIN_NAME`. Ejecutar una vez `php artisan crm:bootstrap-admin` desde el entorno de Render. El comando no imprime la contraseña y no cambia una administradora existente.
3. Establecer `CRM_AUTH_ENABLED=true` y reiniciar Render. La ruta `/api/v1/auth/session` debe responder 401 sin sesión y 200 con la sesión válida.
4. Desplegar el frontend actualizado en Vercel. Iniciar sesión con la primera cuenta y crear las cuentas de secretaría en Configuración. Retirar `CRM_BOOTSTRAP_ADMIN_PASSWORD` del entorno después de crear la cuenta.

No activar `CRM_AUTH_ENABLED` antes de crear la primera cuenta. La aplicación conserva el modo anterior cuando el indicador está desactivado para permitir una transición controlada.

## Perfil y adjuntos de WhatsApp

- Render debe usar `docker/backend.Dockerfile`; `docker/uploads.ini` amplía el límite de PHP. El navegador prepara el logo como JPG cuadrado de 640 px antes de enviarlo.
- `WHATSAPP_APP_ID`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN` deben corresponder a la misma aplicación y número. No colocar estos valores en Vercel ni en el repositorio.
- Probar logo, foto JPG/PNG y PDF con el número de pruebas. Comprobar el resultado en el WhatsApp del cliente y en el historial del CRM. El botón Llamar abre la aplicación telefónica del dispositivo; las llamadas de WhatsApp dentro del CRM requieren integrar por separado la Calling API y su infraestructura de audio.

## Evidencia para el sistema de calidad

ISO 9001:2026 trata la consistencia del servicio, la responsabilidad y la mejora continua. Este CRM apoya esos procesos, pero la conformidad de EPSA depende de sus procedimientos y de una evaluación formal.

| Control operativo | Evidencia del CRM | Verificación recomendada |
| --- | --- | --- |
| Identificación de quien atiende | Usuario individual, responsable de conversación, autor de mensajes | Revisar una atención de cada rol |
| Registro de solicitudes | Conversaciones, mensajes y tickets con fecha y estado | Comparar un mensaje real con su registro |
| Protección de cambios | Roles y registro de acciones | Probar que secretaría no edite perfil ni usuarios |
| Seguimiento de incidentes | Estado, prioridad, responsable y tickets | Registrar y cerrar un caso de prueba |
| Control de errores y mejora | Resultado HTTP en auditoría y pruebas automatizadas | Registrar falla, corrección y repetición de prueba |

Antes de operar con socios reales, EPSA debe aprobar el procedimiento de atención, tiempos de respuesta, responsables, conservación de registros, respaldo de Neon, recuperación del servicio y tratamiento de datos personales. Una prueba de aceptación debe anotar fecha, usuario, número de prueba, resultado esperado, resultado observado y corrección cuando corresponda.
