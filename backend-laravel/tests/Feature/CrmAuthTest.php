<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\CrmAuditLog;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CrmAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['crm.auth_enabled' => true]);
    }

    public function test_admin_can_log_in_create_secretary_and_review_audit(): void
    {
        User::factory()->create(['email' => 'admin@example.test', 'password' => 'long-password-123', 'role' => 'admin']);
        $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.test', 'password' => 'wrong'])->assertStatus(422);
        $login = $this->postJson('/api/v1/auth/login', ['email' => 'admin@example.test', 'password' => 'long-password-123'])->assertOk();
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/v1/auth/session')->assertOk()->assertJsonPath('user.role', 'admin');
        $this->withToken($token)->postJson('/api/v1/auth/users', [
            'name' => 'Secretaría Uno',
            'email' => 'secretary@example.test',
            'password' => 'another-long-password',
            'role' => 'secretary',
        ])->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'secretary@example.test', 'role' => 'secretary']);
        $this->assertSame(1, CrmAuditLog::where('action', 'user.create')->count());

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->withToken($token)->getJson('/api/v1/auth/session')->assertUnauthorized();
    }

    public function test_secretary_can_assign_but_cannot_manage_settings_or_users(): void
    {
        $secretary = User::factory()->create(['role' => 'secretary']);
        $conversation = Conversation::factory()->create();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $secretary->email,
            'password' => 'password',
        ])->assertOk()->json('token');

        $this->getJson('/api/v1/operator/pending')->assertUnauthorized();
        $this->withToken($token)->getJson('/api/v1/operator/pending')->assertOk();
        $this->withToken($token)->postJson("/api/v1/operator/conversation/{$conversation->id}/assign", ['user_id' => $secretary->id])->assertOk();
        $this->assertDatabaseHas('conversations', ['id' => $conversation->id, 'assigned_to' => $secretary->id]);
        $this->withToken($token)->postJson('/api/v1/whatsapp/business-profile', [])->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/auth/users')->assertForbidden();
        $this->withToken($token)->deleteJson("/api/v1/conversations/{$conversation->id}")->assertForbidden();
        $this->assertDatabaseHas('crm_audit_logs', ['user_id' => $secretary->id, 'action' => 'POST api/v1/operator/conversation/{conversationId}/assign']);
    }

    public function test_authorized_operator_can_open_whatsapp_attachment(): void
    {
        config(['whatsapp.api_url' => 'https://graph.facebook.com/v22.0', 'whatsapp.access_token' => 'test-token']);
        $secretary = User::factory()->create(['role' => 'secretary']);
        $conversation = Conversation::factory()->create();
        Message::create(['conversation_id' => $conversation->id, 'sender' => 'human', 'text' => 'Factura PDF', 'metadata' => ['media_id' => '123456', 'media_type' => 'document']]);
        Http::fake([
            'https://graph.facebook.com/v22.0/123456' => Http::response(['url' => 'https://cdn.example.test/file.pdf', 'mime_type' => 'application/pdf']),
            'https://cdn.example.test/file.pdf' => Http::response('%PDF-test', 200, ['Content-Type' => 'application/pdf']),
        ]);
        $token = $this->postJson('/api/v1/auth/login', ['email' => $secretary->email, 'password' => 'password'])->json('token');

        $this->get('/api/v1/operator/media/123456')->assertUnauthorized();
        $this->withToken($token)->get('/api/v1/operator/media/123456')->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertSee('%PDF-test', false);
    }

    public function test_inbox_exposes_latest_inbound_even_after_bot_reply(): void
    {
        $user = User::factory()->create(['role' => 'secretary']);
        $conversation = Conversation::factory()->create();
        $incoming = Message::create(['conversation_id' => $conversation->id, 'sender' => 'user', 'text' => 'Hola']);
        Message::create(['conversation_id' => $conversation->id, 'sender' => 'bot', 'text' => 'Respuesta']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->json('token');

        $response = $this->withToken($token)->getJson('/api/v1/operator/pending')->assertOk();
        $entry = collect($response->json('data'))->firstWhere('id', $conversation->id);
        $this->assertSame($incoming->id, $entry['latest_inbound_id'] ?? null);
    }
}
