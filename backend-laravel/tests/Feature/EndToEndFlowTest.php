<?php

namespace Tests\Feature;

use App\Events\MessageDeleted;
use App\Jobs\ProcessMessageJob;
use App\Models\Bill;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Meter;
use App\Services\IA\OllamaService;
use App\Services\WhatsAppAPIService;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use PHPUnit\Framework\Attributes\DataProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EndToEndFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        putenv('IA_ENABLED=false');
        config(['services.crm.api_token' => 'test-crm-token']);
    }

    public function test_menu_is_deterministic_and_does_not_call_groq(): void
    {
        Http::fake();
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);

        $result = app(WhatsAppService::class)->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'quiero ver el menú',
            'message_id' => 'wamid-menu-flow',
            'session_id' => $conversation->session_id,
        ]);

        $this->assertSame('MENU', $result['analysis']['intent']);
        $this->assertStringContainsString('MENÚ PRINCIPAL', $result['response']);
        Http::assertNothingSent();
    }

    public function test_menu_job_sends_laravel_response_to_whatsapp(): void
    {
        Http::fake(['graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid-out-menu']]], 200)]);
        config([
            'whatsapp.phone_number_id' => 'phone-id',
            'whatsapp.access_token' => 'access-token',
            'whatsapp.development_mode' => false,
        ]);
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'whatsapp_message_id' => 'wamid-menu-job',
            'sender' => 'user',
            'text' => 'quiero ver el menú',
        ]);

        (new ProcessMessageJob([
            'from' => $client->whatsapp_number,
            'text' => 'quiero ver el menú',
            'message_id' => 'wamid-menu-job',
            'stored_message_id' => $message->id,
            'session_id' => $conversation->session_id,
        ]))->handle(app(WhatsAppService::class), app(WhatsAppAPIService::class));

        Http::assertSent(function ($request) {
            $data = $request->data();
            return str_ends_with($request->url(), '/messages')
                && ($data['type'] ?? null) === 'text'
                && str_contains($data['text']['body'] ?? '', 'MENÚ PRINCIPAL');
        });
    }

    public function test_balance_uses_real_pending_bills(): void
    {
        Http::fake();
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $meter = Meter::create(['client_id' => $client->id, 'meter_number' => 'M-' . uniqid(), 'type' => 'residencial', 'status' => 'active']);
        Bill::create(['meter_id' => $meter->id, 'bill_number' => 'B-' . uniqid(), 'amount' => 87.50, 'consumption' => 10, 'issue_date' => now()->toDateString(), 'due_date' => now()->addDays(15)->toDateString(), 'status' => 'pending']);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);

        $result = app(WhatsAppService::class)->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'cuanto devo',
            'message_id' => 'wamid-balance-flow',
            'session_id' => $conversation->session_id,
        ]);

        $this->assertSame('CONSULTAR_SALDO', $result['analysis']['intent']);
        $this->assertStringContainsString('87.50', $result['response']);
        Http::assertNothingSent();
    }

    public function test_operator_transfer_stops_automatic_responses(): void
    {
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);
        $service = app(WhatsAppService::class);

        $transfer = $service->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'quiero hablar con una persona',
            'message_id' => 'wamid-operator-flow',
            'session_id' => $conversation->session_id,
        ]);
        $conversation->refresh();

        $silenced = $service->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'necesito ayuda',
            'message_id' => 'wamid-operator-followup',
            'session_id' => $conversation->session_id,
        ]);

        $this->assertSame('HABLAR_OPERADOR', $transfer['analysis']['intent']);
        $this->assertSame('transferred', $conversation->status);
        $this->assertTrue($conversation->context['operator_required']);
        $this->assertSame('', $silenced['response']);
    }

    #[DataProvider('transferredMessageProvider')]
    public function test_transferred_conversation_follows_greeting_reactivation_policy(string $text, string $expectedStatus, bool $expectsResponse): void
    {
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create([
            'client_id' => $client->id,
            'status' => 'transferred',
            'context' => ['waiting_for' => null, 'operator_required' => true],
        ]);

        $result = app(WhatsAppService::class)->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => $text,
            'message_id' => 'wamid-transfer-' . md5($text),
            'session_id' => $conversation->session_id,
        ]);
        $conversation->refresh();

        $this->assertSame($expectedStatus, $conversation->status);
        $this->assertSame($expectsResponse, $result['response'] !== '');
    }

    public static function transferredMessageProvider(): array
    {
        return [
            ['hola', 'active', true],
            ['hola, quiero hablar con una persona', 'transferred', false],
            ['quiero hablar con un operador', 'transferred', false],
            ['cuanto debo', 'transferred', false],
        ];
    }

    public function test_internal_note_and_delete_are_crm_only_and_broadcast_delete(): void
    {
        Http::fake();
        Event::fake([MessageDeleted::class]);
        $conversation = Conversation::factory()->create();

        $this->withHeader('Authorization', 'Bearer test-crm-token')
            ->postJson('/api/v1/operator/conversation/' . $conversation->id . '/note', ['text' => 'Cliente paga el día 15.'])
            ->assertOk();

        $note = Message::latest('id')->first();
        $this->assertTrue($note->internal);
        $this->assertSame('internal_note', $note->metadata['kind']);
        Http::assertNothingSent();

        $this->withHeader('Authorization', 'Bearer test-crm-token')
            ->deleteJson('/api/v1/messages/' . $note->id)
            ->assertOk();

        Event::assertDispatched(MessageDeleted::class);
        $this->assertSoftDeleted('messages', ['id' => $note->id]);
    }

    public function test_customer_can_confirm_or_interrupt_a_requested_conversation_close(): void
    {
        Http::fake();
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create([
            'client_id' => $client->id,
            'status' => 'active',
            'context' => ['closure_state' => 'awaiting_confirmation', 'waiting_for' => 'closure_confirmation'],
        ]);

        $continued = app(WhatsAppService::class)->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'quiero consultar mi saldo',
            'message_id' => 'wamid-close-interrupt',
            'session_id' => $conversation->session_id,
        ]);
        $conversation->refresh();

        $this->assertSame('CONSULTAR_SALDO', $continued['analysis']['intent']);
        $this->assertSame('none', $conversation->context['closure_state']);

        $conversation->update(['context' => ['closure_state' => 'awaiting_confirmation', 'waiting_for' => 'closure_confirmation']]);
        $closed = app(WhatsAppService::class)->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => '2',
            'message_id' => 'wamid-close-confirm',
            'session_id' => $conversation->session_id,
        ]);
        $conversation->refresh();

        $this->assertSame('CLOSE_CONVERSATION', $closed['analysis']['intent']);
        $this->assertSame('finished', $conversation->status);
        $this->assertSame('closed', $conversation->context['closure_state']);
    }

    public function test_invalid_groq_json_falls_back_to_rules(): void
    {
        putenv('IA_ENABLED=true');
        Http::fake([
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => 'not-json']]]], 200),
        ]);
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);

        $result = (new WhatsAppService())->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'cuanto devo',
            'message_id' => 'wamid-invalid-json',
            'session_id' => $conversation->session_id,
        ]);

        $this->assertSame('CONSULTAR_SALDO', $result['analysis']['intent']);
    }

    public function test_groq_timeout_falls_back_to_safe_generic_response(): void
    {
        putenv('IA_ENABLED=true');
        Http::fake(function () {
            throw new ConnectionException('Groq timeout');
        });
        $client = Client::factory()->create(['name' => 'Cliente', 'metadata' => ['name_confirmed' => true]]);
        $conversation = Conversation::factory()->create(['client_id' => $client->id, 'status' => 'active']);

        $result = (new WhatsAppService())->processIncomingMessage([
            'from' => $client->whatsapp_number,
            'text' => 'necesito información general',
            'message_id' => 'wamid-groq-timeout',
            'session_id' => $conversation->session_id,
        ]);

        $this->assertTrue($result['success']);
        $this->assertStringContainsString('Puedo ayudarte', $result['response']);
        $this->assertSame('otro', $result['analysis']['intent']);
    }

    public function test_meta_5xx_is_bounded_and_throws_for_job_retry(): void
    {
        config([
            'whatsapp.phone_number_id' => 'phone-id',
            'whatsapp.access_token' => 'access-token',
            'whatsapp.development_mode' => false,
        ]);
        Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'temporary']], 503)]);

        $this->expectException(\RuntimeException::class);
        (new WhatsAppAPIService())->sendTextMessage('59170000001', 'respuesta');
    }
}
