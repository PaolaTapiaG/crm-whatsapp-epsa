<?php

namespace Tests\Feature;

use App\Jobs\ProcessMessageJob;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class MessagesAndWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_types_and_internal_notes_are_persisted(): void
    {
        $conversation = Conversation::factory()->create();

        $customer = Message::create(['conversation_id' => $conversation->id, 'sender' => 'user', 'text' => 'hola']);
        $operator = Message::create(['conversation_id' => $conversation->id, 'sender' => 'human', 'text' => 'nota', 'internal' => true]);
        $ai = Message::create(['conversation_id' => $conversation->id, 'sender' => 'bot', 'text' => 'respuesta']);

        $this->assertSame('customer', $customer->sender_type);
        $this->assertSame('operator', $operator->sender_type);
        $this->assertTrue($operator->internal);
        $this->assertTrue($ai->ai_generated);
    }

    public function test_duplicate_whatsapp_message_is_not_created(): void
    {
        config(['whatsapp.app_secret' => 'test-secret']);
        $client = Client::factory()->create();
        $conversation = Conversation::factory()->create(['client_id' => $client->id]);
        Message::create([
            'conversation_id' => $conversation->id,
            'whatsapp_message_id' => 'wamid-test-1',
            'sender' => 'user',
            'text' => 'hola',
        ]);

        $response = $this->postJson('/api/v1/whatsapp/webhook', [], [
            'X-Hub-Signature-256' => 'sha256:invalid',
        ]);

        $this->assertSame(403, $response->status());
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_signed_webhook_dispatches_job_and_persists_message(): void
    {
        Queue::fake();
        config(['whatsapp.app_secret' => 'test-secret']);
        $payload = [
            'entry' => [[
                'changes' => [[
                    'value' => [
                        'contacts' => [['wa_id' => '59170000001', 'profile' => ['name' => 'Test User']]],
                        'messages' => [[
                            'from' => '59170000001',
                            'id' => 'wamid-test-2',
                            'type' => 'text',
                            'text' => ['body' => 'hola'],
                        ]],
                    ],
                ]],
            ]],
        ];
        $signature = 'sha256=' . hash_hmac('sha256', json_encode($payload), 'test-secret');

        $response = $this->call('POST', '/api/v1/whatsapp/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $signature,
        ], json_encode($payload));

        $response->assertOk();
        $this->assertDatabaseHas('messages', ['whatsapp_message_id' => 'wamid-test-2']);
        Queue::assertPushed(ProcessMessageJob::class);

        $duplicateResponse = $this->call('POST', '/api/v1/whatsapp/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $signature,
        ], json_encode($payload));
        $duplicateResponse->assertOk();

        $this->assertDatabaseCount('messages', 1);
        Queue::assertPushed(ProcessMessageJob::class, 1);
    }

    public function test_message_delete_requires_crm_token_and_soft_deletes(): void
    {
        config(['services.crm.api_token' => 'test-crm-token']);
        $conversation = Conversation::factory()->create();
        $message = Message::factory()->create(['conversation_id' => $conversation->id]);

        $this->deleteJson('/api/v1/messages/' . $message->id)->assertUnauthorized();
        $this->withHeader('Authorization', 'Bearer test-crm-token')
            ->deleteJson('/api/v1/messages/' . $message->id)
            ->assertOk();

        $this->assertSoftDeleted('messages', ['id' => $message->id]);
    }

    public function test_message_job_has_bounded_retry_policy(): void
    {
        $job = new ProcessMessageJob(['from' => '59170000001', 'message_id' => 'wamid-policy']);

        $this->assertSame(3, $job->tries);
        $this->assertSame(90, $job->timeout);
        $this->assertSame([10, 30, 60], $job->backoff());
    }
}
