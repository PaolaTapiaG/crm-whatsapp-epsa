<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meter_id')->constrained()->cascadeOnDelete();
            $table->string('bill_number')->unique();
            $table->decimal('amount', 10, 2);
            $table->decimal('consumption', 10, 2)->default(0);
            $table->date('issue_date');
            $table->date('due_date');
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('bills'); }
};