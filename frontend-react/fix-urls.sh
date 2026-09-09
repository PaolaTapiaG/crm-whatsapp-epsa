
#!/bin/bash

echo "🔧 Arreglando URLs de API..."
echo ""

# 1. Buscar archivos con URL de Render
echo "1. Archivos con URL de Render:"
grep -rl "crm-whatsapp-epsa.onrender.com" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null

# 2. Reemplazar URLs
echo ""
echo "2. Reemplazando URLs..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  --exclude-dir=node_modules --exclude-dir=.git \
  -exec sed -i 's|https://crm-whatsapp-epsa.onrender.com/api/v1|/api/v1|g' {} +

# 3. Verificar
echo ""
echo "3. Verificando..."
if grep -r "crm-whatsapp-epsa.onrender.com" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
    echo "❌ Aún quedan URLs por actualizar"
else
    echo "✅ Todas las URLs actualizadas"
fi

# 4. Mostrar archivos actualizados
echo ""
echo "4. Archivos que usan /api/v1:"
grep -rl "/api/v1" src/ 2>/dev/null | head -10
