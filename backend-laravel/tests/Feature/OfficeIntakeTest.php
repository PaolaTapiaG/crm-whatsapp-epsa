<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OfficeIntakeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['crm.auth_enabled' => true]);
    }

    private function secretaryToken(): string
    {
        $user = User::factory()->create(['role' => 'secretary']);
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()->json('token');
    }

    public function test_walk_in_without_phone_creates_a_traceable_case(): void
    {
        $token = $this->secretaryToken();
        $payload = [
            'name' => 'Socia sin teléfono',
            'source' => 'office',
            'subject' => 'Consulta de horarios',
            'description' => 'Solicita el horario en oficina.',
            'category' => 'consulta',
            'priority' => 'normal',
        ];

        $this->postJson('/api/v1/operator/intake', $payload)->assertUnauthorized();
        $response = $this->withToken($token)->postJson('/api/v1/operator/intake', $payload)
            ->assertCreated()->assertJsonPath('data.conversation.channel', 'office');
        $clientId = $response->json('data.conversation.client.id');
        $conversationId = $response->json('data.conversation.id');
        $this->assertDatabaseHas('clients', ['id' => $clientId, 'whatsapp_number' => null]);
        $this->assertDatabaseHas('messages', ['conversation_id' => $conversationId, 'sender' => 'user']);
        $this->assertDatabaseHas('tickets', ['conversation_id' => $conversationId, 'category' => 'consulta']);
        $this->assertMatchesRegularExpression('/^TKT-\d{4}-\d{4,}$/', $response->json('data.ticket.ticket_number'));
        $this->assertSame($response->json('data.ticket.ticket_number'), Conversation::find($conversationId)->metadata['ticket_number']);
        $this->assertSame(1, Ticket::find($response->json('data.ticket.id'))->history()->count());
    }

    public function test_paper_intake_reuses_client_and_keeps_channel_histories_separate(): void
    {
        $token = $this->secretaryToken();
        $client = Client::factory()->create();
        $whatsApp = Conversation::factory()->create(['client_id' => $client->id, 'channel' => 'whatsapp']);
        Message::create(['conversation_id' => $whatsApp->id, 'sender' => 'user', 'text' => 'Mensaje privado de WhatsApp']);

        $response = $this->withToken($token)->postJson('/api/v1/operator/intake', [
            'client_id' => $client->id,
            'source' => 'paper',
            'paper_reference' => 'FORM-12',
            'received_at' => now()->subDay()->toIso8601String(),
            'subject' => 'Reporte escrito',
            'description' => 'El socio dejó un formulario en ventanilla.',
            'category' => 'servicio',
            'priority' => 'high',
        ])->assertCreated();
        $officeId = $response->json('data.conversation.id');
        $this->assertSame($client->id, $response->json('data.conversation.client.id'));
        $this->assertSame('FORM-12', Conversation::find($officeId)->metadata['paper_reference']);
        $inbox = $this->withToken($token)->getJson('/api/v1/operator/pending')->assertOk();
        $this->assertContains($officeId, array_column($inbox->json('data'), 'id'));
        $this->assertContains($whatsApp->id, array_column($inbox->json('data'), 'id'));
        $officeMessages = $this->withToken($token)->getJson("/api/v1/operator/conversation/{$officeId}/messages")->assertOk()->json('data');
        $this->assertCount(1, $officeMessages);
        $this->assertSame('El socio dejó un formulario en ventanilla.', $officeMessages[0]['text']);
    }

    public function test_office_case_cannot_trigger_whatsapp_send(): void
    {
        $token = $this->secretaryToken();
        $client = Client::factory()->create();
        $office = Conversation::factory()->create(['client_id' => $client->id, 'channel' => 'office']);
        Http::fake();

        $this->withToken($token)->postJson('/api/v1/operator/send-message', [
            'conversation_id' => $office->id,
            'to' => $client->whatsapp_number,
            'text' => 'No enviar',
        ])->assertStatus(422);
        Http::assertNothingSent();
    }

    public function test_office_contact_can_be_found_by_a_non_whatsapp_phone(): void
    {
        $token = $this->secretaryToken();
        $this->withToken($token)->postJson('/api/v1/operator/intake', [
            'name' => 'Socia de oficina',
            'phone' => '76123456',
            'source' => 'office',
            'subject' => 'Consulta',
            'description' => 'Pregunta por el horario.',
            'category' => 'consulta',
            'priority' => 'normal',
        ])->assertCreated();

        $result = $this->withToken($token)->getJson('/api/v1/clients?search=76123456')->assertOk();
        $this->assertSame('Socia de oficina', $result->json('data.data.0.name'));
    }
}
