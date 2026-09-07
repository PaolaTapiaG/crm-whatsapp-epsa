
#!/bin/bash

echo "🔍 Diagnosticando webhook de WhatsApp..."
echo ""

# 1. Verificar Laravel
echo "1. Verificando Laravel..."
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Laravel está corriendo"
else
    echo "❌ Laravel NO está corriendo"
    echo "   Inicia con: php artisan serve --port=8000"
fi

# 2. Verificar ngrok
echo ""
echo "2. Verificando ngrok..."
if curl -s https://sandpaper-rocking-unsalted.ngrok-free.dev > /dev/null; then
    echo "✅ ngrok está funcionando"
else
    echo "❌ ngrok NO está funcionando"
    echo "   Inicia con: ngrok http 8000"
fi

# 3. Verificar endpoint de verificación local
echo ""
echo "3. Probando verificación local..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=my_verify_token_123&hub.challenge=123456")
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Verificación local correcta (HTTP 200)"
else
    echo "❌ Verificación local falló (HTTP $RESPONSE)"
fi

# 4. Probar verificación vía ngrok
echo ""
echo "4. Probando verificación vía ngrok..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://sandpaper-rocking-unsalted.ngrok-free.dev/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=my_verify_token_123&hub.challenge=123456")
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Verificación vía ngrok correcta (HTTP 200)"
else
    echo "❌ Verificación vía ngrok falló (HTTP $RESPONSE)"
fi

# 5. Ver logs
echo ""
echo "5. Últimos logs de Laravel:"
tail -5 storage/logs/laravel.log 2>/dev/null || echo "No hay logs"

echo ""
echo "✅ Diagnóstico completado"
