<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/media/{path}', function (string $path) {
    abort_if(str_contains($path, '..'), 404);

    $disk = Storage::disk('public');
    abort_unless($disk->exists($path), 404);

    return response()->file($disk->path($path), [
        'Content-Type' => mime_content_type($disk->path($path)) ?: 'application/octet-stream',
        'Content-Disposition' => 'inline',
    ]);
})->where('path', '.*');
