<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            IntentSeeder::class,
            ClientSeeder::class,
            WaterDomainSeeder::class,
        ]);
    }
}