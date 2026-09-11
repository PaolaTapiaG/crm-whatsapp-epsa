
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
use App\Http\Middleware\EnsureCors;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::options('{any}', function (Request $request) {
    $response = response('', 204);

    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', '*');
    $response->headers->set('Access-Control-Max-Age', '86400');

    return $response;
})->where('any', '.*');

Route::middleware(EnsureCors::class)->prefix('v1')->group(function () {
    
    // WhatsApp Webhooks
    Route::prefix('whatsapp')->group(function () {
        Route::get('/webhook', [WhatsAppController::class, 'verifyWebhook']);
        Route::post('/webhook', [WhatsAppController::class, 'webhook']);
        Route::post('/send-message', [WhatsAppController::class, 'sendMessage']);
        Route::get('/business-profile', [WhatsAppController::class, 'businessProfile']);
        Route::post('/business-profile', [WhatsAppController::class, 'updateBusinessProfile']);
        Route::get('/status', [WhatsAppController::class, 'status']);
    });
    
    // Clientes
    Route::apiResource('clients', ClientController::class);
    Route::get('clients/{id}/conversations', [ClientController::class, 'conversations']);
    Route::get('clients/{id}/stats', [ClientController::class, 'stats']);
    
    // Conversaciones
    Route::apiResource('conversations', ConversationController::class);
    Route::get('conversations/{id}/messages', [ConversationController::class, 'messages']);
    Route::patch('conversations/{id}/status', [ConversationController::class, 'updateStatus']);
    Route::post('conversations/{id}/transfer', [ConversationController::class, 'transferToHuman']);
    Route::post('conversations/{id}/close', [ConversationController::class, 'close']);
    Route::get('conversations-stats', [ConversationController::class, 'stats']);
    
    // Mensajes
    Route::apiResource('messages', MessageController::class);
    
    // Tickets
    Route::apiResource('tickets', TicketController::class);
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
        Route::post('/send-message', [OperatorController::class, 'sendMessage']);
        Route::post('/conversation/{conversationId}/qr', [OperatorController::class, 'sendQr']);
        Route::post('/conversation/{conversationId}/voice', [OperatorController::class, 'sendVoice']);
        Route::patch('/payment/{messageId}', [OperatorController::class, 'reviewPayment']);
        Route::post('/conversation/{conversationId}/invoice', [OperatorController::class, 'sendInvoice']);
        Route::post('/conversation/{conversationId}/location', [OperatorController::class, 'sendLocation']);
        Route::post('/broadcast', [OperatorController::class, 'broadcast']);
        Route::post('/transfer/{conversationId}', [OperatorController::class, 'transfer']);
        Route::post('/close/{conversationId}', [OperatorController::class, 'close']);
    });
    
});
