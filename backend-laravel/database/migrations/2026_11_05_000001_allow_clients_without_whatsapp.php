<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table): void {
            $table->string('whatsapp_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Do not make this required again: office-only clients may have no WhatsApp number.
    }
};
