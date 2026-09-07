
#!/bin/bash

set -o pipefail

WEBHOOK_PUBLIC_URL="${WEBHOOK_PUBLIC_URL:-}"
VERIFY_TOKEN="${WHATSAPP_VERIFY_TOKEN:-my_verify_token_123}"

echo "🧪 Verificando respuesta automática..."
echo ""

# 1. Verificar Laravel
echo "1. Verificando Laravel..."
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Laravel corriendo"
else
    echo "❌ Laravel NO está corriendo"
    echo "   Inicia: php artisan serve --port=8000"
fi

# 2. Verificar webhook
echo ""
echo "2. Verificando webhook..."
if [ -z "$WEBHOOK_PUBLIC_URL" ]; then
  echo "❌ WEBHOOK_PUBLIC_URL no está configurada"
  echo "   Ejemplo: export WEBHOOK_PUBLIC_URL=https://tu-tunel.trycloudflare.com"
  RESPONSE="000"
else
  RESPONSE=$(curl -sS --connect-timeout 10 -o /dev/null -w "%{http_code}" "${WEBHOOK_PUBLIC_URL%/}/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=123456789")
fi
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Webhook respondiendo (HTTP 200)"
else
    echo "❌ Webhook fallando (HTTP $RESPONSE)"
fi

# 3. Verificar estado de WhatsApp
echo ""
echo "3. Estado de WhatsApp API:"
STATUS=$(curl -sS --connect-timeout 10 -w "\n__HTTP_STATUS__:%{http_code}" http://localhost:8000/api/v1/whatsapp/status)
STATUS_BODY="${STATUS%$'\n'__HTTP_STATUS__:*}"
STATUS_CODE="${STATUS##*__HTTP_STATUS__:}"
if [ "$STATUS_CODE" = "200" ] && printf '%s' "$STATUS_BODY" | python3 -m json.tool; then
  :
else
  echo "❌ Laravel no devolvió JSON válido (HTTP $STATUS_CODE)"
  printf '%s\n' "$STATUS_BODY"
fi

# 4. Simular mensaje entrante
echo ""
echo "4. Simulando mensaje entrante..."
curl -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "59168739907",
            "id": "test-message-123",
            "type": "text",
            "text": {"body": "Hola"}
          }],
          "contacts": [{
            "wa_id": "59168739907",
            "profile": {"name": "Test User"}
          }]
        }
      }]
    }]
  }'

echo ""
echo "✅ Verificación completada"
