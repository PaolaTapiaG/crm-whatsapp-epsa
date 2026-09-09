
#!/bin/bash

set -u

echo "Diagnosticando Water CRM IA..."

PROJECT_ROOT="${CRM_PROJECT_ROOT:-$HOME/water-crm-ia/water-crm-ia}"
BACKEND_ROOT="${PROJECT_ROOT}/backend-laravel"
LARAVEL_URL="${LARAVEL_URL:-http://127.0.0.1:8000}"

if [ ! -f "${BACKEND_ROOT}/artisan" ]; then
	echo "No se encontro Laravel en: ${BACKEND_ROOT}"
	echo "Define CRM_PROJECT_ROOT con la ruta correcta y vuelve a ejecutar."
	exit 1
fi

# 1. Ver procesos
echo "Procesos relevantes:"
ps -eo pid,stat,etime,cmd | grep -E '[p]hp artisan serve|[n]ode server.js' || true

# 2. Ver puertos
echo ""
echo "Puertos en uso:"
ss -ltnp 2>/dev/null | grep -E ':8000|:8001|:3000|:3001' || true

# 3. Ver rutas
echo ""
echo "Rutas de WhatsApp:"
cd "${BACKEND_ROOT}"
php artisan route:list --path=whatsapp | grep -i whatsapp || true

# 4. Probar API
echo ""
echo "Probando API:"
curl -sS --max-time 10 "${LARAVEL_URL}/api/v1/whatsapp/status" 2>&1 | head -20

# 5. Ver logs
echo ""
echo "Últimos errores:"
tail -20 "${BACKEND_ROOT}/storage/logs/laravel.log" 2>/dev/null || true

