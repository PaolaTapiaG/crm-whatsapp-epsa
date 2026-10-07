
#!/bin/bash

echo "🧪 Probando CORS en Render..."
echo ""

# Probar endpoint con OPTIONS
echo "1. Probando OPTIONS (pre-flight):"
curl -i -X OPTIONS "https://crm-whatsapp-epsa.onrender.com/api/v1/dashboard/stats" \
  -H "Origin: https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type" 2>/dev/null

echo ""
echo "─────────────────────────────────────"
echo ""

# Probar endpoint con GET
echo "2. Probando GET:"
curl -i "https://crm-whatsapp-epsa.onrender.com/api/v1/dashboard/stats" 2>/dev/null

echo ""
echo "─────────────────────────────────────"
echo ""

# Probar endpoint con GET y Origin
echo "3. Probando GET con Origin:"
curl -i "https://crm-whatsapp-epsa.onrender.com/api/v1/dashboard/stats" \
  -H "Origin: https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app" 2>/dev/null

echo ""
echo "✅ Prueba completada"
