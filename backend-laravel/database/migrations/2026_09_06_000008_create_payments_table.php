<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method');
            $table->string('reference')->nullable();
            $table->date('payment_date');
            $table->string('status')->default('completed');
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('payments'); }
};