<?php

namespace Database\Seeders;

use App\Models\Intent;
use Illuminate\Database\Seeder;

class IntentSeeder extends Seeder
{
    public function run(): void
    {
        $intents = [
            [
                'name' => 'saludo',
                'description' => 'El usuario saluda al asistente',
                'keywords' => ['hola', 'buenas', 'saludos', 'hey'],
                'response_template' => '¡Hola! 👋 Bienvenido al servicio de agua. ¿En qué puedo ayudarte?',
                'requires_action' => 'none',
                'priority' => 1,
            ],
            [
                'name' => 'consultar_saldo',
                'description' => 'El usuario quiere saber su saldo pendiente',
                'keywords' => ['saldo', 'debo', 'deuda', 'pagar', 'factura'],
                'response_template' => 'Para consultar tu saldo, necesito tu número de cliente.',
                'requires_action' => 'query_database',
                'priority' => 5,
            ],
            [
                'name' => 'reportar_fuga',
                'description' => 'El usuario reporta una fuga de agua',
                'keywords' => ['fuga', 'agua', 'fugas', 'filtración', 'goteo'],
                'response_template' => 'Lamento escuchar sobre la fuga. Voy a crear un ticket de soporte.',
                'requires_action' => 'create_ticket',
                'priority' => 10,
            ],
            [
                'name' => 'falta_suministro',
                'description' => 'El usuario reporta falta de suministro de agua',
                'keywords' => ['no tengo agua', 'sin agua', 'corte', 'suministro'],
                'response_template' => 'Entiendo que no tienes agua. Déjame verificar si hay cortes programados en tu zona.',
                'requires_action' => 'query_database',
                'priority' => 10,
            ],
            [
                'name' => 'queja',
                'description' => 'El usuario tiene una queja',
                'keywords' => ['queja', 'mal servicio', 'problema', 'reclamo'],
                'response_template' => 'Lamento mucho tu experiencia. Tomaré nota de tu queja.',
                'requires_action' => 'create_ticket',
                'priority' => 8,
            ],
            [
                'name' => 'solicitar_servicio',
                'description' => 'El usuario quiere solicitar un servicio',
                'keywords' => ['instalación', 'conexión', 'servicio nuevo', 'contratar'],
                'response_template' => '¡Excelente! Me encantaría ayudarte a solicitar el servicio.',
                'requires_action' => 'create_ticket',
                'priority' => 7,
            ],
            [
                'name' => 'despedida',
                'description' => 'El usuario se despide',
                'keywords' => ['adiós', 'chau', 'hasta luego', 'bye'],
                'response_template' => '¡Gracias por contactarnos! Que tengas un excelente día 😊',
                'requires_action' => 'none',
                'priority' => 1,
            ],
        ];

        foreach ($intents as $intent) {
            Intent::updateOrCreate(
                ['name' => $intent['name']],
                $intent,
            );
        }
    }
}