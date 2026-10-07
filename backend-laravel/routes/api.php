<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\WhatsAppController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\IntentController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\OperatorController;
use App\Http\Middleware\VerifyWhatsAppWebhook;
use App\Http\Middleware\ApiAuthentication;
use App\Http\Middleware\RequireCrmAdmin;
use App\Http\Controllers\Api\V1\CrmAuthController;
use App\Http\Middleware\AuditCrmAction;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    Route::get('/auth/session', [CrmAuthController::class, 'session'])->middleware('throttle:crm-api');
    Route::post('/auth/login', [CrmAuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/auth/logout', [CrmAuthController::class, 'logout'])->middleware(ApiAuthentication::class);
    Route::get('/auth/team', [CrmAuthController::class, 'team'])->middleware(ApiAuthentication::class);
    Route::get('/auth/users', [CrmAuthController::class, 'users'])->middleware([ApiAuthentication::class, RequireCrmAdmin::class]);
    Route::post('/auth/users', [CrmAuthController::class, 'createUser'])->middleware([ApiAuthentication::class, RequireCrmAdmin::class]);
    Route::get('/auth/audit', [CrmAuthController::class, 'audit'])->middleware([ApiAuthentication::class, RequireCrmAdmin::class]);
    
    // WhatsApp Webhooks
    Route::prefix('whatsapp')->group(function () {
        Route::get('/webhook', [WhatsAppController::class, 'verifyWebhook'])->middleware('throttle:whatsapp-webhook');
        Route::post('/webhook', [WhatsAppController::class, 'webhook'])
            ->middleware([VerifyWhatsAppWebhook::class, 'throttle:whatsapp-webhook']);
        Route::post('/send-message', [WhatsAppController::class, 'sendMessage'])->middleware(['throttle:crm-api', ApiAuthentication::class]);
        Route::get('/business-profile', [WhatsAppController::class, 'businessProfile'])->middleware(['throttle:crm-api', ApiAuthentication::class]);
        Route::post('/business-profile', [WhatsAppController::class, 'updateBusinessProfile'])->middleware(['throttle:crm-api', ApiAuthentication::class, RequireCrmAdmin::class, AuditCrmAction::class]);
        Route::get('/status', [WhatsAppController::class, 'status'])->middleware('throttle:crm-api');
        Route::get('/quota', [WhatsAppController::class, 'quota'])->middleware(['throttle:crm-api', ApiAuthentication::class]);
    });

    Route::middleware(['throttle:crm-api', ApiAuthentication::class, AuditCrmAction::class])->group(function () {
    
    // Clientes
    Route::apiResource('clients', ClientController::class)->except('destroy');
    Route::delete('clients/{client}', [ClientController::class, 'destroy'])->middleware(RequireCrmAdmin::class);
    Route::get('clients/{id}/conversations', [ClientController::class, 'conversations']);
    Route::get('clients/{id}/stats', [ClientController::class, 'stats']);
    
    // Conversaciones
    Route::apiResource('conversations', ConversationController::class)->except('destroy');
    Route::delete('conversations/{conversation}', [ConversationController::class, 'destroy'])->middleware(RequireCrmAdmin::class);
    Route::get('conversations/{id}/messages', [ConversationController::class, 'messages']);
    Route::patch('conversations/{id}/status', [ConversationController::class, 'updateStatus']);
    Route::post('conversations/{id}/transfer', [ConversationController::class, 'transferToHuman']);
    Route::post('conversations/{id}/close', [ConversationController::class, 'close']);
    Route::get('conversations-stats', [ConversationController::class, 'stats']);
    
    // Mensajes
    Route::apiResource('messages', MessageController::class)->except('destroy');
    Route::delete('messages/{message}', [MessageController::class, 'destroy'])->middleware(RequireCrmAdmin::class);
    
    // Tickets
    Route::apiResource('tickets', TicketController::class)->except('destroy');
    Route::delete('tickets/{ticket}', [TicketController::class, 'destroy'])->middleware(RequireCrmAdmin::class);
    Route::patch('tickets/{id}/status', [TicketController::class, 'updateStatus']);
    Route::patch('tickets/{id}/assign', [TicketController::class, 'assign']);
    Route::post('tickets/{id}/comments', [TicketController::class, 'addComment']);
    
    // Intenciones
    Route::apiResource('intents', IntentController::class);
    
    // Dashboard
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/recent-messages', [DashboardController::class, 'recentMessages']);
    Route::get('dashboard/top-intents', [DashboardController::class, 'topIntents']);
    Route::get('dashboard/ia-status', [DashboardController::class, 'iaStatus']);

    Route::prefix('operator')->group(function () {
        Route::get('/pending', [OperatorController::class, 'pending']);
        Route::get('/conversation/{conversationId}/messages', [OperatorController::class, 'messages']);
        Route::post('/conversation/{conversationId}/assign', [OperatorController::class, 'assign']);
        Route::get('/media/{mediaId}', [OperatorController::class, 'media']);
        Route::post('/send-message', [OperatorController::class, 'sendMessage']);
        Route::post('/conversation/{conversationId}/qr', [OperatorController::class, 'sendQr']);
        Route::post('/conversation/{conversationId}/voice', [OperatorController::class, 'sendVoice']);
        Route::post('/conversation/{conversationId}/attachment', [OperatorController::class, 'sendAttachment']);
        Route::post('/conversation/{conversationId}/contact', [OperatorController::class, 'sendContact']);
        Route::post('/forward-message', [OperatorController::class, 'forwardMessage']);
        Route::patch('/payment/{messageId}', [OperatorController::class, 'reviewPayment']);
        Route::post('/conversation/{conversationId}/invoice', [OperatorController::class, 'sendInvoice']);
        Route::post('/conversation/{conversationId}/location', [OperatorController::class, 'sendLocation']);
        Route::post('/conversation/{conversationId}/note', [OperatorController::class, 'storeNote']);
        Route::post('/conversation/{conversationId}/request-close', [OperatorController::class, 'requestClose']);
        Route::post('/broadcast', [OperatorController::class, 'broadcast'])->middleware(RequireCrmAdmin::class);
        Route::post('/transfer/{conversationId}', [OperatorController::class, 'transfer']);
        Route::post('/close/{conversationId}', [OperatorController::class, 'close']);
    });
    });
});
