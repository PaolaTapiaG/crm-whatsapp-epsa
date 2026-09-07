
#!/bin/bash

echo "🔧 Arreglando Telescope..."

# 1. Crear tabla cache que falta
echo "📝 Creando tabla cache..."
mysql -h 127.0.0.1 -u laravel -ppassword << 'SQLEOF'
USE water_crm;
CREATE TABLE IF NOT EXISTS cache (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` MEDIUMTEXT,
    `expiration` INT
);
SQLEOF

# 2. Verificar tablas de Telescope
echo "🔍 Verificando tablas de Telescope..."
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES LIKE 'telescope%';"

# 3. Si no existen, crearlas
php artisan telescope:install
php artisan migrate --force

# 4. Limpiar caché
echo "🧹 Limpiando caché..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 5. Verificar
echo "✅ Verificación:"
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES;"

echo ""
echo "Reinicia el servidor:"
echo "php artisan serve"
