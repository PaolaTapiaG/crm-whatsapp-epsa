#!/bin/bash

echo "🔄 Recreando base de datos completa..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Eliminar migraciones problemáticas
echo "🗑️ Eliminando migraciones duplicadas..."
rm -f database/migrations/2024_01_01_*.php
rm -f database/migrations/2026_09_04_*.php

# 2. Verificar qué queda
echo "📁 Migraciones restantes:"
ls -la database/migrations/

# 3. Resetear base de datos
echo "🔄 Reseteando base de datos..."
php artisan migrate:reset --force

# 4. Crear migraciones nuevas
echo "📝 Creando nuevas migraciones..."
php artisan make:migration create_clients_table --create=clients
php artisan make:migration create_conversations_table --create=conversations
php artisan make:migration create_messages_table --create=messages
php artisan make:migration create_tickets_table --create=tickets
php artisan make:migration create_intents_table --create=intents
php artisan make:migration create_settings_table --create=settings

echo -e "${GREEN}✅ Migraciones creadas${NC}"
echo ""
echo -e "${YELLOW}Ahora edita cada archivo de migración con el contenido correcto${NC}"
echo "Luego ejecuta: php artisan migrate"

