
#!/bin/bash

echo "🔍 Verificando Vercel Proxy..."
echo ""

# 1. Verificar vercel.json
echo "1. vercel.json:"
if [ -f crm-fronted/vercel.json ]; then
    echo "   ✅ Existe"
    cat crm-fronted/vercel.json
else
    echo "   ❌ No existe"
fi

# 2. Verificar URLs actualizadas
echo ""
echo "2. URLs de Render restantes:"
grep -r "crm-whatsapp-epsa.onrender.com" crm-fronted/src/ 2>/dev/null || echo "   ✅ Todas actualizadas"

# 3. Verificar git status
echo ""
echo "3. Estado de git:"
git status --short

# 4. Verificar último commit
echo ""
echo "4. Último commit:"
git log -1 --oneline

# 5. Probar desde el navegador
echo ""
echo "5. Para probar:"
echo "   Abre en tu navegador:"
echo "   https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app"
echo ""
echo "   Luego abre DevTools (F12) → Network"
echo "   Verifica que las solicitudes a /api/v1/... funcionan"
