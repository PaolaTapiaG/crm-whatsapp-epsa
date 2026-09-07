<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\Client;
use App\Models\Meter;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class WaterDomainSeeder extends Seeder
{
    public function run(): void
    {
        $zones = collect(['Norte', 'Sur', 'Este', 'Oeste', 'Centro'])->mapWithKeys(fn ($name) => [
            $name => Zone::firstOrCreate(['name' => $name], ['description' => "Zona de servicio {$name}"]),
        ]);

        Client::query()->each(function (Client $client) use ($zones) {
            $zoneName = $client->metadata['zone'] ?? 'Centro';
            $zone = $zones[$zoneName] ?? $zones['Centro'];
            $meter = Meter::firstOrCreate(
                ['meter_number' => str_pad((string) $client->id, 6, '0', STR_PAD_LEFT)],
                ['client_id' => $client->id, 'zone_id' => $zone->id, 'type' => 'residencial', 'status' => 'active']
            );

            Bill::firstOrCreate(
                ['bill_number' => 'FAC-' . str_pad((string) $meter->id, 6, '0', STR_PAD_LEFT)],
                ['meter_id' => $meter->id, 'amount' => 87.50, 'consumption' => 12, 'issue_date' => now()->startOfMonth(), 'due_date' => now()->addDays(15), 'status' => 'pending']
            );
        });
    }
}