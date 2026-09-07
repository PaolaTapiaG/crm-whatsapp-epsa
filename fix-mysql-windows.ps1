$ErrorActionPreference = 'Stop'

$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
if (-not (Test-Path $mysql)) {
    throw "No se encontró MySQL Server 8.0 en: $mysql"
}

$securePassword = Read-Host 'Contraseña del usuario root de MySQL (no se guarda)' -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $securePassword)
$env:MYSQL_PWD = $credential.Password

try {
    & $mysql --protocol=TCP -h 127.0.0.1 -P 3306 -u root -e @"
CREATE DATABASE IF NOT EXISTS water_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'laravel'@'localhost' IDENTIFIED BY 'password';
CREATE USER IF NOT EXISTS 'laravel'@'127.0.0.1' IDENTIFIED BY 'password';
CREATE USER IF NOT EXISTS 'laravel'@'%' IDENTIFIED BY 'password';
ALTER USER 'laravel'@'localhost' IDENTIFIED BY 'password';
ALTER USER 'laravel'@'127.0.0.1' IDENTIFIED BY 'password';
ALTER USER 'laravel'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'localhost';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'127.0.0.1';
GRANT ALL PRIVILEGES ON water_crm.* TO 'laravel'@'%';
FLUSH PRIVILEGES;
"@
    if ($LASTEXITCODE -ne 0) { throw 'MySQL rechazó las credenciales administrativas.' }

    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    & $mysql --protocol=TCP -h 127.0.0.1 -P 3306 -u laravel -ppassword -e 'SELECT 1 AS database_connection;'
    if ($LASTEXITCODE -ne 0) { throw 'El usuario laravel todavía no puede conectarse.' }

    Set-Location (Join-Path $PSScriptRoot 'backend-laravel')
    php artisan config:clear
    php artisan migrate --force
    php artisan db:show
    Write-Host 'MySQL y Laravel quedaron configurados correctamente.' -ForegroundColor Green
}
finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}
