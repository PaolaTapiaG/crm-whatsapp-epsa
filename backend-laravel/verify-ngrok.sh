
#!/bin/bash

echo "🔍 Obteniendo URL actual de ngrok..."

# Obtener URL actual de ngrok
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
data = json.load(sys.stdin)
for tunnel in data['tunnels']:
    if tunnel['proto'] == 'https':
        print(tunnel['public_url'])
        break
")

if [ -z "$NGROK_URL" ]; then
    echo "❌ No se pudo obtener la URL de ngrok"
    echo "Asegúrate de que ngrok está corriendo: ngrok http 8000"
    exit 1
fi

echo "✅ URL actual de ngrok: $NGROK_URL"
echo ""

# Probar webhook
echo "Probando webhook..."
WEBHOOK_URL="$NGROK_URL/api/v1/whatsapp/webhook"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL?hub.mode=subscribe&hub.verify_token=my_verify_token_123&hub.challenge=123456")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Webhook funciona correctamente"
    echo ""
    echo "📋 Configura esto en Meta Developers:"
    echo "   Callback URL: $WEBHOOK_URL"
    echo "   Verify Token: my_verify_token_123"
else
    echo "❌ Webhook falló (HTTP $RESPONSE)"
fi
