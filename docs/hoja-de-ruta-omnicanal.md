# Hoja de ruta del CRM omnicanal de EPSA El Portillo

Esta hoja de ruta conecta el prototipo con el flujo descrito en el perfil de proyecto de grado. Es una propuesta de implementación, no una afirmación de que los procedimientos de la EPSA ya estén aprobados. La población preliminar de 758 registros, la estimación de uso de WhatsApp y los roles deben confirmarse en el trabajo de campo.

## Etapa 1: recepción y expediente común

**Implementado en el código local:** registro de atención en oficina o de formulario escrito, con fecha de recepción, referencia del papel, socio existente o nuevo sin teléfono, relato, categoría, prioridad, conversación de canal `office`, ticket con folio e historial inicial. La bandeja distingue WhatsApp y oficina. Un caso presencial muestra notas internas y no puede enviarse accidentalmente por la API de WhatsApp.

**Antes de publicar:** aplicar la migración que permite socios sin número de WhatsApp, activar cuentas individuales, probar con una base de ensayo y verificar el procedimiento de constancia para quien acude a ventanilla. La fecha real del formulario se conserva separada de la fecha en que se digitó.

En desarrollo, el frontend usa `/api/v1` y el proxy de Vite apunta por defecto a Laravel local (`127.0.0.1:8000`). Solo `VITE_API_PROXY_TARGET` cambia ese destino de forma explícita. Una URL de Render guardada en otras variables no debe hacer que las pruebas locales lean o escriban datos publicados.

## Etapa 2: clasificación y asignación

Entrevistar a las tres secretarias y a responsables técnicos para mapear el proceso actual. Acordar categorías de consulta, solicitud, reporte técnico, queja y reclamo formal; definir quién valida cada categoría, quién recibe la derivación y qué información mínima se solicita. El sistema deberá conservar cambios de categoría, responsable, prioridad y estado con actor y fecha. Un reclamo sujeto a ODECO no quedará sustituido por un ticket general: la EPSA debe confirmar aplicabilidad, folios, constancias y plazos.

**Prueba de aceptación:** una solicitud que pasa de ventanilla a otra secretaria conserva relato, folio, responsable y siguiente acción; una fuga puede escalarse al área técnica sin declararse reparada por el bot.

## Etapa 3: respuesta, verificación y cierre

Separar resolución interna, comunicación del resultado y cierre. El ticket solo podrá cerrarse con motivo, responsable, fecha y evidencia de comunicación por el canal elegido o disponible. La reapertura conservará el mismo expediente. Las respuestas automáticas se limitarán a información general aprobada; saldos y pagos requerirán fuente institucional autorizada y verificación de identidad.

**Prueba de aceptación:** una respuesta del bot no marca el caso como resuelto; un caso presencial puede cerrarse con constancia de ventanilla, sin exigir teléfono.

## Etapa 4: indicadores y piloto

Medir por canal casos con folio, asignación, primera respuesta humana, resolución, reaperturas y formularios conciliados. Publicar siempre periodo, numerador y denominador; no atribuir mejoras al CRM sin línea de base comparable. Probar seguridad, respaldo, recuperación, accesibilidad móvil y continuidad cuando WhatsApp o internet fallen. El piloto debe usar datos autorizados y aprobación institucional antes de atender a socios reales.
