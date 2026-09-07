<?php

use Illuminate\Support\Facades\Route;

Route::prefix('ia')->group(function (): void {
    Route::get('/health', fn () => response()->json(['status' => 'ok']));
});