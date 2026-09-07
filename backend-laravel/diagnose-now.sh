
#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO..."
echo ""

# 1. Laravel
echo "1. LARAVEL:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|302"; then
    echo "   ✅ Corriendo en puerto 8000"
else
    echo "   ❌ NO responde"
fi

# 2. Cloudflare
echo ""
echo "2. CLOUDFLARE:"
if pgrep -x "cloudflared" > /dev/null; then
    echo "   ✅ Proceso activo"
else
    echo "   ❌ NO está corriendo"
    echo "   Inicia: cloudflared tunnel --url http://localhost:8000"
fi

# 3. Verificar logs recientes
echo ""
echo "3. ÚLTIMOS LOGS:"
tail -20 storage/logs/laravel.log 2>/dev/null || echo "   No hay logs"

# 4. Verificar webhook en Meta
echo ""
echo "4. VERIFICAR EN META:"
echo "   URL: https://developers.facebook.com/apps/"
echo "   → WhatsApp → Configuration → Webhook"
echo "   Asegúrate que el webhook esté ACTIVO"

