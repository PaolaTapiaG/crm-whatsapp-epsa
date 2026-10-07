<?php

namespace Tests\Feature;

use App\Jobs\ProcessMessageJob;
use App\Exceptions\WhatsAppQuotaExceededException;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use App\Services\WhatsAppAPIService;
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

    public function test_whatsapp_quota_endpoint_warns_near_limit(): void
    {
        config([
            'services.crm.api_token' => 'test-crm-token',
            'whatsapp.quota.free_service_messages' => 3,
            'whatsapp.quota.warning_threshold' => 2,
            'whatsapp.quota.critical_threshold' => 3,
        ]);
        $conversation = Conversation::factory()->create();
        Message::create(['conversation_id' => $conversation->id, 'sender' => 'bot', 'text' => 'uno']);
        Message::create(['conversation_id' => $conversation->id, 'sender' => 'human', 'text' => 'dos']);

        $response = $this->withHeader('Authorization', 'Bearer test-crm-token')
            ->getJson('/api/v1/whatsapp/quota')
            ->assertOk()
            ->json('data');

        $this->assertSame('warning', $response['status']);
        $this->assertSame(2, $response['used']);
        $this->assertSame(1, $response['remaining']);
    }

    public function test_whatsapp_send_is_blocked_when_quota_is_exceeded(): void
    {
        Http::fake();
        config([
            'whatsapp.phone_number_id' => 'phone-id',
            'whatsapp.access_token' => 'access-token',
            'whatsapp.development_mode' => false,
            'whatsapp.quota.free_service_messages' => 1,
            'whatsapp.quota.warning_threshold' => 1,
            'whatsapp.quota.critical_threshold' => 1,
            'whatsapp.quota.emergency_mode' => 'block_auto',
        ]);
        $conversation = Conversation::factory()->create();
        Message::create(['conversation_id' => $conversation->id, 'sender' => 'bot', 'text' => 'uno']);

        $this->expectException(WhatsAppQuotaExceededException::class);
        app(WhatsAppAPIService::class)->sendTextMessage('59170000001', 'dos');

        Http::assertNothingSent();
    }

    public function test_business_profile_photo_upload_uses_resumable_oauth_header(): void
    {
        config([
            'whatsapp.api_url' => 'https://graph.facebook.com/v19.0',
            'whatsapp.phone_number_id' => 'phone-id',
            'whatsapp.app_id' => 'app-id',
            'whatsapp.access_token' => 'access-token',
        ]);

        Http::fake([
            'graph.facebook.com/v19.0/app-id/uploads' => Http::response(['id' => 'upload-session-id'], 200),
            'graph.facebook.com/v19.0/upload-session-id' => Http::response(['h' => 'picture-handle'], 200),
            'graph.facebook.com/v19.0/phone-id/whatsapp_business_profile' => Http::response(['success' => true], 200),
        ]);

        app(WhatsAppAPIService::class)->updateBusinessProfile([
            'about' => 'EPSA',
            'address' => 'Oficina central',
            'description' => 'Servicio de agua',
            'vertical' => 'OTHER',
        ], UploadedFile::fake()->image('logo.jpg', 640, 640));

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://graph.facebook.com/v19.0/upload-session-id'
                && $request->hasHeader('Authorization', 'OAuth access-token')
                && $request->hasHeader('file_offset', '0');
        });

        Http::assertSent(function (Request $request) {
            return $request->url() === 'https://graph.facebook.com/v19.0/phone-id/whatsapp_business_profile'
                && ($request->data()['profile_picture_handle'] ?? null) === 'picture-handle';
        });
    }
}
