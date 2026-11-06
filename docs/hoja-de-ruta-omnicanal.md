# Hoja de ruta del CRM omnicanal de EPSA El Portillo

Esta hoja de ruta conecta el prototipo con el flujo descrito en el perfil de proyecto de grado. Es una propuesta de implementación, no una afirmación de que los procedimientos de la EPSA ya estén aprobados. La población preliminar de 758 registros, la estimación de uso de WhatsApp y los roles deben confirmarse en el trabajo de campo.

## Etapa 1: recepción y expediente común

**Implementado en el código:** recepción manual de oficina, formulario físico, llamada y SMS recibido, además de WhatsApp automático. Cada registro manual conserva canal, fecha de recepción, referencia, socio existente o nuevo, código de cuenta si se conoce, dirección, clase de atención, relato, tema, prioridad, medio previsto para comunicar la respuesta, folio interno e historial inicial. Un reclamo puede asociar el número ODECO ya asignado y una fecha tentativa de respuesta. La bandeja distingue los cinco orígenes. Ningún caso manual se envía accidentalmente por la API de WhatsApp.

La migración para socios sin WhatsApp se aplicó a la base de ensayo de Neon antes de publicar. Quedan pendientes cuentas individuales activadas en el servicio, prueba de recepción con personal de la EPSA y definición institucional de constancias. La fecha real del formulario se conserva separada de la fecha en que se digitó. Los registros de llamada y SMS son transcripciones manuales: todavía no existe integración telefónica ni proveedor de SMS entrante/saliente.

## Correspondencia con la normativa boliviana

La [RAR AAPS 476/2024](https://www.aaps.gob.bo/wordpress/wp-content/uploads/Documentacion/ResolucionesAdministrativasRegulatorias/RAR_476_2024.pdf) aprueba el reglamento de ODECO para **EPSA reguladas de centros urbanos**. Antes de tratarla como exigencia directa para EPSA El Portillo, hay que verificar su categoría y condición regulatoria con la entidad y la AAPS. Su artículo 7 reconoce atención personal, escrita, telefónica y tecnológica; los artículos 17–19 tratan formularios, datos mínimos y registros de reclamos; los artículos 26–33 establecen el tratamiento de emergencias, constancia, correlativo y plazos. La [Ley 453](https://www.lexivox.org/norms/BO-L-N453.html), artículo 26, reconoce el derecho a reclamar y a obtener atención y resolución.

**Límite del prototipo:** `TKT-AAAA-ID` es un folio interno de seguimiento, no el número correlativo oficial de reclamación ODECO. El sistema permite registrar un número ODECO externo, pero todavía no genera su correlativo anual, no imprime automáticamente el formulario aprobado y no demuestra la entrega sellada de la copia física. Esos pasos deben diseñarse con la EPSA antes de afirmar cumplimiento formal. Los plazos de respuesta de reclamos directos se ingresan como fecha tentativa verificada por secretaría; el CRM no los calcula jurídicamente ni despacha emergencias por sí solo. En emergencias, el sistema muestra un límite de atención de 24 horas desde la **recepción original** conforme al artículo 26 de la RAR citada, incluso cuando el formulario se digitaliza después. La derivación debe hacerse de inmediato por el procedimiento institucional y el personal debe registrar la comunicación del resultado.

En desarrollo, el frontend usa `/api/v1` y el proxy de Vite apunta por defecto a Laravel local (`127.0.0.1:8000`). Solo `VITE_API_PROXY_TARGET` cambia ese destino de forma explícita. Una URL de Render guardada en otras variables no debe hacer que las pruebas locales lean o escriban datos publicados.

## Etapa 2: clasificación y asignación

Entrevistar a las tres secretarias y a responsables técnicos para mapear el proceso actual. Acordar categorías de consulta, solicitud, reclamo directo y emergencia; definir quién valida cada categoría, quién recibe la derivación y qué información mínima se solicita. El sistema deberá conservar cambios de categoría, responsable, prioridad y estado con actor y fecha. Un reclamo sujeto a ODECO no quedará sustituido por un ticket general: la EPSA debe confirmar aplicabilidad, formularios aprobados, correlativos, constancias y plazos.

**Prueba de aceptación:** una solicitud que pasa de ventanilla a otra secretaria conserva relato, folio, responsable y siguiente acción; una fuga puede escalarse al área técnica sin declararse reparada por el bot.

## Etapa 3: respuesta, verificación y cierre

Separar resolución interna, comunicación del resultado y cierre. El ticket solo podrá cerrarse con motivo, responsable, fecha y evidencia de comunicación por el canal elegido o disponible. La reapertura conservará el mismo expediente. Las respuestas automáticas se limitarán a información general aprobada; saldos y pagos requerirán fuente institucional autorizada y verificación de identidad.

**Prueba de aceptación:** una respuesta del bot no marca el caso como resuelto; un caso presencial puede cerrarse con constancia de ventanilla, sin exigir teléfono.

## Etapa 4: indicadores y piloto

Medir por canal casos con folio, asignación, primera respuesta humana, resolución, reaperturas y formularios conciliados. Publicar siempre periodo, numerador y denominador; no atribuir mejoras al CRM sin línea de base comparable. Probar seguridad, respaldo, recuperación, accesibilidad móvil y continuidad cuando WhatsApp o internet fallen. El piloto debe usar datos autorizados y aprobación institucional antes de atender a socios reales.
