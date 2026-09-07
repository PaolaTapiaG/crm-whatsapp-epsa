<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'whatsapp_number' => '+591' . $this->faker->unique()->numerify('7#######'),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'language' => 'es',
            'status' => 'active',
            'metadata' => [
                'zone' => $this->faker->city(),
                'client_type' => $this->faker->randomElement(['residencial', 'comercial', 'industrial']),
            ],
            'last_interaction_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}