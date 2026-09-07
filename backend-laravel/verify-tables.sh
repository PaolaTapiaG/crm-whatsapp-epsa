
#!/bin/bash

echo "🔍 Verificando tablas de la base de datos..."

# Ver todas las tablas
echo "Tablas actuales:"
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES;" 2>/dev/null

# Verificar migraciones
echo ""
echo "Estado de migraciones:"
php artisan migrate:status

# Verificar si faltan tablas
echo ""
echo "Verificando tablas faltantes..."

# Check settings
if ! mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES LIKE 'settings';" 2>/dev/null | grep -q settings; then
    echo "❌ Falta tabla 'settings'"
    echo "Creando..."
    php artisan make:migration create_settings_table --create=settings
fi

# Check intents
if ! mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES LIKE 'intents';" 2>/dev/null | grep -q intents; then
    echo "❌ Falta tabla 'intents'"
    echo "Creando..."
    php artisan make:migration create_intents_table --create=intents
fi

# Check telescope
if ! mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES LIKE 'telescope%';" 2>/dev/null | grep -q telescope; then
    echo "❌ Faltan tablas de Telescope"
    echo "Instalando Telescope..."
    php artisan telescope:install
fi

# Ejecutar migraciones pendientes
echo ""
echo "Ejecutando migraciones pendientes..."
php artisan migrate --force

echo ""
echo "✅ Verificación completada"
echo ""
echo "Tablas finales:"
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES;" 2>/dev/null

