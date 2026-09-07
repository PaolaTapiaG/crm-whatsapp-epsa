<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cache')) {
            return;
        }

        $addedKey = ! Schema::hasColumn('cache', 'key');

        Schema::table('cache', function (Blueprint $table): void {
            if (! Schema::hasColumn('cache', 'key')) {
                $table->string('key')->nullable();
            }

            if (! Schema::hasColumn('cache', 'value')) {
                $table->mediumText('value')->nullable();
            }

            if (! Schema::hasColumn('cache', 'expiration')) {
                $table->integer('expiration')->nullable();
            }
        });

        if (Schema::hasColumn('cache', 'id')) {
            Schema::table('cache', function (Blueprint $table): void {
                $table->dropColumn(['id', 'created_at', 'updated_at']);
            });
        }

        if ($addedKey) {
            Schema::table('cache', function (Blueprint $table): void {
                $table->unique('key');
            });
        }
    }

    public function down(): void
    {
        // The cache table is disposable and is recreated by the base migration.
    }
};