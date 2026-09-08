#!/bin/bash

set -u

printf '%s\n' "Verificando archivos CORS desde la raiz..."
printf '\n%s\n' "1. Dockerfile:"
if [ -f docker/backend.Dockerfile ]; then
    printf '%s\n' "   Existe en docker/backend.Dockerfile"
else
    printf '%s\n' "   No existe"
fi

printf '\n%s\n' "2. Middleware EnsureCors:"
if [ -f backend-laravel/app/Http/Middleware/EnsureCors.php ]; then
    printf '%s\n' "   Existe"
    grep -n "Access-Control-Allow-Origin" backend-laravel/app/Http/Middleware/EnsureCors.php || true
else
    printf '%s\n' "   No existe"
fi

printf '\n%s\n' "3. Config CORS:"
if [ -f backend-laravel/config/cors.php ]; then
    printf '%s\n' "   Existe"
    grep -n "allowed_origins" backend-laravel/config/cors.php || true
else
    printf '%s\n' "   No existe"
fi

printf '\n%s\n' "4. Estado de git:"
git status --short

printf '\n%s\n' "5. Ultimo commit:"
git log -1 --oneline

printf '\n%s\n' "6. Contenido del middleware en Git:"
git show HEAD:backend-laravel/app/Http/Middleware/EnsureCors.php 2>/dev/null | head -20 || printf '%s\n' "   No hay version commiteada"

printf '\n%s\n' "Verificacion completada"
