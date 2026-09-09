
#!/bin/bash

echo "🔍 Buscando URL de Render en TODOS los archivos..."
echo ""

# 1. Buscar en src
echo "1. En src/:"
grep -r "onrender" src/ 2>/dev/null || echo "   ✅ No encontrado en src/"

# 2. Buscar en archivos de configuración
echo ""
echo "2. En archivos de configuración:"
grep -r "onrender" .env* vite.config.* package.json index.html 2>/dev/null || echo "   ✅ No encontrado en config"

# 3. Buscar en TODO el proyecto
echo ""
echo "3. Búsqueda exhaustiva:"
find . -type f -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" | while read file; do
  if grep -q "onrender" "$file" 2>/dev/null; then
    echo "   ENCONTRADO: $file"
    grep "onrender" "$file"
    echo ""
  fi
done

# 4. Buscar en dist (build compilado)
echo ""
echo "4. En dist/ (build compilado):"
if [ -d "dist" ]; then
  grep -r "onrender" dist/ 2>/dev/null | head -5 || echo "   ✅ No encontrado en dist/"
else
  echo "   ✅ No hay carpeta dist/"
fi

echo ""
echo "✅ Búsqueda completada"
