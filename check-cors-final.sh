
#!/bin/bash

echo "🔍 Verificación final de CORS..."
echo ""

# 1. Ver bootstrap/app.php
echo "1. bootstrap/app.php:"
grep -A5 "withMiddleware" backend-laravel/bootstrap/app.php

# 2. Ver middleware
echo ""
echo "2. EnsureCors.php:"
head -15 backend-laravel/app/Http/Middleware/EnsureCors.php

# 3. Ver config/cors.php
echo ""
echo "3. config/cors.php:"
grep "allowed_origins" backend-laravel/config/cors.php

# 4. Git status
echo ""
echo "4. Git status:"
git status --short

echo ""
echo "5. Último commit:"
git log -1 --oneline

# 6. Probar CORS
echo ""
echo "6. Probando CORS:"
curl -i -X OPTIONS "https://crm-whatsapp-epsa.onrender.com/api/v1/dashboard/stats" \
  -H "Origin: https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null | head -15

echo ""
echo "✅ Verificación completada"
