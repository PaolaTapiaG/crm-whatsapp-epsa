<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        $userMessages = [
            'Hola, necesito ayuda con mi factura',
            '¿Cuál es mi saldo pendiente?',
            'Tengo una fuga de agua en mi casa',
            'No tengo agua desde ayer',
            'Quiero reportar un problema',
            '¿Cuándo vendrán a revisar mi medidor?',
            'Gracias por la información',
            'Necesito cambiar mi plan de servicio',
        ];

        $botMessages = [
            '¡Hola! ¿En qué puedo ayudarte?',
            'Claro, déjame verificar tu información',
            'He creado un ticket para tu solicitud',
            'Un técnico te contactará pronto',
            '¿Hay algo más en lo que pueda ayudarte?',
            'Tu solicitud ha sido registrada',
        ];

        $isUserMessage = $this->faker->boolean(50);
        
        return [
            'conversation_id' => Conversation::factory(),
            'sender' => $isUserMessage ? 'user' : 'bot',
            'text' => $isUserMessage 
                ? $this->faker->randomElement($userMessages)
                : $this->faker->randomElement($botMessages),
            'intent' => $this->faker->randomElement(['saludo', 'consultar_saldo', 'reportar_fuga', 'falta_suministro', 'queja', 'solicitar_servicio', 'despedida']),
            'sentiment' => $this->faker->randomFloat(2, -1, 1),
            'confidence' => $this->faker->randomFloat(2, 0.5, 0.99),
            'metadata' => [
                'processed' => true,
                'response_time_ms' => $this->faker->numberBetween(100, 3000),
            ],
            'read_at' => $this->faker->optional(0.8)->dateTimeBetween('-1 day', 'now'),
        ];
    }

    // Estados personalizados
    public function fromUser()
    {
        return $this->state(function (array $attributes) {
            return [
                'sender' => 'user',
                'text' => $this->faker->randomElement([
                    'Hola, necesito ayuda',
                    'Tengo un problema con mi servicio',
                    '¿Pueden ayudarme con mi factura?',
                ]),
            ];
        });
    }

    public function fromBot()
    {
        return $this->state(function (array $attributes) {
            return [
                'sender' => 'bot',
                'text' => $this->faker->randomElement([
                    '¡Hola! Estoy aquí para ayudarte',
                    'He procesado tu solicitud',
                    '¿Necesitas algo más?',
                ]),
            ];
        });
    }

    public function withIntent($intent)
    {
        return $this->state(function (array $attributes) use ($intent) {
            return [
                'intent' => $intent,
            ];
        });
    }
}
