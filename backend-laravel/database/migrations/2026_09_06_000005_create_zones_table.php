<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->boolean('has_water')->default(true);
            $table->boolean('has_maintenance')->default(false);
            $table->date('maintenance_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('zones'); }
};