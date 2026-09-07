<?php

use Illuminate\Support\Facades\Route;

Route::prefix('whatsapp')->group(function (): void {
    Route::get('/webhook', fn () => response()->json(['status' => 'ok']));
});