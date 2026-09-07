<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creando clientes de prueba...');

        // Crear 20 clientes
        Client::factory()
            ->count(20)
            ->create()
            ->each(function ($client) {
                // Crear 2-5 conversaciones por cliente
                $conversations = Conversation::factory()
                    ->count(rand(2, 5))
                    ->create([
                        'client_id' => $client->id,
                    ]);

                // Crear 3-10 mensajes por conversación
                foreach ($conversations as $conversation) {
                    Message::factory()
                        ->count(rand(3, 10))
                        ->create([
                            'conversation_id' => $conversation->id,
                        ]);
                }
            });

        // Crear clientes específicos para pruebas
        $testClients = [
            [
                'whatsapp_number' => '+59170000001',
                'name' => 'Juan Pérez',
                'email' => 'juan.perez@email.com',
                'phone' => '+59170000001',
                'address' => 'Av. Principal #123, Zona Norte',
                'language' => 'es',
                'status' => 'active',
                'metadata' => [
                    'zone' => 'Norte',
                    'client_type' => 'residencial',
                    'service_type' => 'agua',
                    'account_number' => 'ACCT-00001',
                ],
            ],
            [
                'whatsapp_number' => '+59170000002',
                'name' => 'María García',
                'email' => 'maria.garcia@email.com',
                'phone' => '+59170000002',
                'address' => 'Calle Comercio #456, Zona Sur',
                'language' => 'es',
                'status' => 'active',
                'metadata' => [
                    'zone' => 'Sur',
                    'client_type' => 'comercial',
                    'service_type' => 'ambos',
                    'account_number' => 'ACCT-00002',
                ],
            ],
            [
                'whatsapp_number' => '+59170000003',
                'name' => 'Carlos Rodríguez',
                'email' => 'carlos.rodriguez@email.com',
                'phone' => '+59170000003',
                'address' => 'Av. Industrial #789, Zona Este',
                'language' => 'es',
                'status' => 'active',
                'metadata' => [
                    'zone' => 'Este',
                    'client_type' => 'industrial',
                    'service_type' => 'ambos',
                    'account_number' => 'ACCT-00003',
                ],
            ],
        ];

        foreach ($testClients as $clientData) {
            $client = Client::create($clientData);
            
            // Crear una conversación activa para cada cliente de prueba
            $conversation = Conversation::create([
                'client_id' => $client->id,
                'session_id' => 'test-session-' . $client->id,
                'status' => 'active',
                'channel' => 'whatsapp',
                'priority' => 'normal',
                'context' => [
                    'last_intent' => 'saludo',
                    'conversation_stage' => 'inicio',
                ],
                'started_at' => now(),
            ]);

            // Crear mensajes de prueba
            Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'user',
                'text' => 'Hola, necesito información sobre mi servicio',
                'intent' => 'saludo',
                'sentiment' => 0.5,
                'confidence' => 0.95,
                'read_at' => now(),
            ]);

            Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'bot',
                'text' => '¡Hola! 👋 Bienvenido al servicio de agua. ¿En qué puedo ayudarte?',
                'intent' => 'saludo',
                'sentiment' => 0.8,
                'confidence' => 0.98,
                'read_at' => now(),
            ]);
        }

        $this->command->info('✅ Clientes de prueba creados correctamente');
        $this->command->info('   - 20 clientes aleatorios');
        $this->command->info('   - 3 clientes específicos para pruebas');
    }
}