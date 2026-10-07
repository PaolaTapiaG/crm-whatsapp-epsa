
#!/bin/bash

echo "🔍 Verificando contenido en GitHub..."
echo ""

echo "1. Último commit:"
git log -1 --oneline

echo ""
echo "2. Contenido de EnsureCors.php en GitHub:"
git show HEAD:backend-laravel/app/Http/Middleware/EnsureCors.php | grep -A5 "OPTIONS"

echo ""
echo "3. Contenido de bootstrap/app.php en GitHub:"
git show HEAD:backend-laravel/bootstrap/app.php | grep -A10 "withMiddleware"

echo ""
echo "4. Commits recientes:"
git log --oneline -5
