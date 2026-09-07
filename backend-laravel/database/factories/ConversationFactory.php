<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'session_id' => Str::uuid()->toString(),
            'status' => $this->faker->randomElement(['active', 'pending', 'closed', 'transferred']),
            'channel' => 'whatsapp',
            'priority' => $this->faker->randomElement(['low', 'normal', 'high', 'urgent']),
            'context' => [
                'last_intent' => $this->faker->randomElement(['saludo', 'consulta', 'queja']),
                'conversation_stage' => $this->faker->randomElement(['inicio', 'en_proceso', 'final']),
            ],
            'metadata' => [
                'source' => 'whatsapp',
                'user_agent' => 'WhatsApp-Business',
            ],
            'started_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
            'ended_at' => null,
        ];
    }

    // Estados personalizados
    public function active()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'active',
                'ended_at' => null,
            ];
        });
    }

    public function closed()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'closed',
                'ended_at' => $this->faker->dateTimeBetween('-1 day', 'now'),
            ];
        });
    }

    public function highPriority()
    {
        return $this->state(function (array $attributes) {
            return [
                'priority' => 'high',
            ];
        });
    }
}