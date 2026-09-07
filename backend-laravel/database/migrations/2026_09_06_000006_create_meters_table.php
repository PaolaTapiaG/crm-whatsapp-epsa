<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('meters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained()->nullOnDelete();
            $table->string('meter_number')->unique();
            $table->string('type')->default('residencial');
            $table->decimal('current_reading', 10, 2)->default(0);
            $table->decimal('last_reading', 10, 2)->default(0);
            $table->date('last_reading_date')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('meters'); }
};