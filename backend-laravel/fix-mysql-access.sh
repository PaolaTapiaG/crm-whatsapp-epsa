
#!/bin/bash

echo "🔧 Arreglando acceso a MySQL..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Asegurar que MySQL está corriendo
echo "📦 Verificando MySQL..."
sudo service mysql start
sudo service mysql status

# 2. Recrear usuario
echo "👤 Recreando usuario laravel..."
sudo mysql << 'SQLEOF'
-- Eliminar usuarios existentes
DROP USER IF EXISTS 'laravel'@'localhost';
DROP USER IF EXISTS 'laravel'@'127.0.0.1';
DROP USER IF EXISTS 'laravel'@'%';

-- Crear usuarios nuevos
CREATE USER 'laravel'@'localhost' IDENTIFIED BY 'password';
CREATE USER 'laravel'@'127.0.0.1' IDENTIFIED BY 'password';
CREATE USER 'laravel'@'%' IDENTIFIED BY 'password';

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS water_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar todos los privilegios
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'localhost';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'127.0.0.1';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'%';

-- También dar permisos globales
GRANT ALL PRIVILEGES ON *.* TO 'laravel'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'laravel'@'127.0.0.1';

FLUSH PRIVILEGES;
SQLEOF

# 3. Probar conexión
echo "🔍 Probando conexión..."
if mysql -h 127.0.0.1 -u laravel -ppassword -e "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ Conexión exitosa${NC}"
else
    echo -e "${RED}❌ Error de conexión${NC}"
    echo "Intentando con localhost..."
    if mysql -h localhost -u laravel -ppassword -e "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Conexión exitosa con localhost${NC}"
    fi
fi

# 4. Actualizar .env
echo "📝 Actualizando .env..."
# Backup
cp .env .env.backup

# Actualizar configuración
sed -i 's/^DB_HOST=.*/DB_HOST=127.0.0.1/' .env
sed -i 's/^DB_DATABASE=.*/DB_DATABASE=water_crm/' .env
sed -i 's/^DB_USERNAME=.*/DB_USERNAME=laravel/' .env
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=password/' .env

# 5. Limpiar caché
echo "🧹 Limpiando caché..."
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear

# 6. Verificar con Laravel
echo "🔍 Verificando con Laravel..."
if php artisan db:show &> /dev/null; then
    echo -e "${GREEN}✅ Laravel conecta correctamente${NC}"
else
    echo -e "${RED}❌ Laravel no puede conectar${NC}"
    echo "Verifica manualmente:"
    echo "1. nano .env"
    echo "2. Verificar DB_USERNAME y DB_PASSWORD"
fi

echo ""
echo "Configuración actual:"
grep -E "DB_" .env

