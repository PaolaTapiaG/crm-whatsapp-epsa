<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexNames = collect(Schema::getIndexes('tickets'))->pluck('name')->all();

        Schema::table('tickets', function (Blueprint $table) use ($indexNames): void {
            if (! in_array('tickets_ticket_number_unique', $indexNames, true)) {
                $table->unique('ticket_number', 'tickets_ticket_number_unique');
            }
            if (! in_array('tickets_client_status_index', $indexNames, true)) {
                $table->index(['client_id', 'status'], 'tickets_client_status_index');
            }
        });
    }

    public function down(): void
    {
        $indexNames = collect(Schema::getIndexes('tickets'))->pluck('name')->all();

        Schema::table('tickets', function (Blueprint $table) use ($indexNames): void {
            if (in_array('tickets_ticket_number_unique', $indexNames, true)) {
                $table->dropUnique('tickets_ticket_number_unique');
            }
            if (in_array('tickets_client_status_index', $indexNames, true)) {
                $table->dropIndex('tickets_client_status_index');
            }
        });
    }
};
