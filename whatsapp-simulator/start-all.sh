
#!/bin/bash

echo "🚀 Iniciando Water CRM IA..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Iniciar servicios
echo "📦 Iniciando servicios..."
sudo service mysql start
sudo service redis-server start
echo -e "${GREEN}✅ Servicios iniciados${NC}"

# 2. Limpiar caché Laravel
echo "🧹 Limpiando caché..."
cd /mnt/c/CRMWhatsaap/water-crm-ia/backend-laravel
php artisan config:clear
php artisan cache:clear
echo -e "${GREEN}✅ Caché limpiada${NC}"

# 3. Iniciar Laravel
echo "🌐 Iniciando Laravel..."
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!
echo -e "${GREEN}✅ Laravel iniciado (PID: $LARAVEL_PID)${NC}"

# 4. Iniciar Horizon
echo "📊 Iniciando Horizon..."
php artisan horizon &
HORIZON_PID=$!
echo -e "${GREEN}✅ Horizon iniciado (PID: $HORIZON_PID)${NC}"

echo ""
echo "========================================="
echo "✅ Sistema iniciado correctamente"
echo "========================================="
echo ""
echo "URLs disponibles:"
echo "  📱 Simulador:  http://localhost:5173"
echo "  🌐 Laravel:    http://localhost:8000"
echo "  📊 Horizon:    http://localhost:8000/horizon"
echo "  🔬 Telescope:  http://localhost:8000/telescope"
echo ""
echo "Presiona Ctrl+C para detener todo"
echo "========================================="

# Esperar
wait
