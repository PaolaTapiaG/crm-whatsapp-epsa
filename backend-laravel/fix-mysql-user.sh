
#!/bin/bash

echo "🔧 Configurando usuario MySQL para Laravel..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar MySQL
echo "📦 Verificando MySQL..."
sudo service mysql start

# 2. Configurar usuario
echo "👤 Configurando usuario laravel..."
sudo mysql << EOF
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

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'localhost';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'127.0.0.1';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'%';

FLUSH PRIVILEGES;
