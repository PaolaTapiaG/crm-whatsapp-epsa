
#!/bin/bash

echo "🔍 Verificando archivos CORS..."
echo ""

# 1. Verificar Dockerfile
echo "1. Dockerfile:"
if [ -f docker/backend.Dockerfile ]; then
    echo "   ✅ Existe en docker/backend.Dockerfile"
    head -5 docker/backend.Dockerfile
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
cd /mnt/c/CRMWhatsaap/water-crm-ia
git status --short

echo ""
echo "✅ Verificación completada"
