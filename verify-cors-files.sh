
#!/bin/bash

echo "🔍 Verificando archivos CORS desde la raíz..."
echo ""

# 1. Verificar Dockerfile
echo "1. Dockerfile:"
if [ -f docker/backend.Dockerfile ]; then
    echo "   ✅ Existe en docker/backend.Dockerfile"
else
    echo "   ❌ No existe"
fi

# 2. Verificar middleware
echo ""
echo "2. Middleware EnsureCors:"
if [ -f backend-laravel/app/Http/Middleware/EnsureCors.php ]; then
    echo "   ✅ Existe"
    grep "Access-Control-Allow-Origin" backend-laravel/app/Http/Middleware/EnsureCors.php
else
    echo "   ❌ No existe"
fi

# 3. Verificar config/cors.php
echo ""
echo "3. Config CORS:"
if [ -f backend-laravel/config/cors.php ]; then
    echo "   ✅ Existe"
    grep "allowed_origins" backend-laravel/config/cors.php
else
    echo "   ❌ No existe"
fi

# 4. Verificar git
echo ""
echo "4. Estado de git:"
git status --short

echo ""
echo "5. Último commit:"
git log -1 --oneline

echo ""
echo "6. Contenido del middleware en GitHub:"
git show HEAD:backend-laravel/app/Http/Middleware/EnsureCors.php 2>/dev/null | head -20 || echo "   No hay versión commiteada"

echo ""
echo "✅ Verificación completada"
