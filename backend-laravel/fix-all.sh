
#!/bin/bash

echo "🔧 Recreando base de datos completa desde cero..."

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Eliminar TODAS las tablas de la base de datos
echo "🗑️ Eliminando todas las tablas..."
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS clients, conversations, messages, tickets, intents, settings, cache, jobs, failed_jobs, users, password_reset_tokens, personal_access_tokens, telescope_entries, telescope_entries_tags, telescope_monitoring, migrations; SET FOREIGN_KEY_CHECKS = 1;"

# 2. Eliminar TODOS los archivos de migración
echo "🗑️ Eliminando archivos de migración..."
rm -f database/migrations/*.php

# 3. Verificar que no quedan migraciones
echo "📁 Migraciones restantes:"
ls -la database/migrations/ 2>/dev/null || echo "Directorio vacío"

# 4. Crear migraciones base de Laravel
echo "📝 Creando migraciones base..."
php artisan migrate:install

# 5. Crear archivos de migración limpios
echo "📝 Creando migraciones del CRM..."

# Clients
cat > database/migrations/2026_09_05_100001_create_clients_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_number')->unique();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('language')->default('es');
            $table->string('status')->default('active');
            $table->json('metadata')->nullable();
            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
PHPEOF

# Conversations
cat > database/migrations/2026_09_05_100002_create_conversations_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('session_id')->unique();
            $table->string('status')->default('active');
            $table->string('channel')->default('whatsapp');
            $table->string('priority')->default('normal');
            $table->json('context')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
PHPEOF

# Messages
cat > database/migrations/2026_09_05_100003_create_messages_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->string('sender');
            $table->text('text');
            $table->string('intent')->nullable();
            $table->float('sentiment')->nullable();
            $table->float('confidence')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
PHPEOF

# Tickets
cat > database/migrations/2026_09_05_100004_create_tickets_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->string('priority')->default('normal');
            $table->string('status')->default('open');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
PHPEOF

# Intents
cat > database/migrations/2026_09_05_100005_create_intents_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intents', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->json('keywords')->nullable();
            $table->text('response_template')->nullable();
            $table->string('requires_action')->nullable();
            $table->integer('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intents');
    }
};
PHPEOF

# Settings
cat > database/migrations/2026_09_05_100006_create_settings_table.php << 'PHPEOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
PHPEOF

# 6. Dar permisos
chmod -R 777 database/migrations/

# 7. Limpiar caché
echo "🧹 Limpiando caché..."
php artisan config:clear
php artisan cache:clear

# 8. Ejecutar migraciones
echo "🚀 Ejecutando migraciones..."
php artisan migrate --force

# 9. Verificar
echo "✅ Verificando tablas..."
php artisan db:table

echo ""
echo -e "${GREEN}✅ Base de datos recreada correctamente${NC}"
echo ""
echo "Tablas creadas:"
mysql -h 127.0.0.1 -u laravel -ppassword -e "USE water_crm; SHOW TABLES;"

