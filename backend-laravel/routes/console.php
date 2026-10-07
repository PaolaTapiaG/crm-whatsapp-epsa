<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('crm:bootstrap-admin', function () {
    $email = trim((string) env('CRM_BOOTSTRAP_ADMIN_EMAIL'));
    $password = (string) env('CRM_BOOTSTRAP_ADMIN_PASSWORD');
    $name = trim((string) env('CRM_BOOTSTRAP_ADMIN_NAME', 'Administración'));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
        $this->error('Configura CRM_BOOTSTRAP_ADMIN_EMAIL y una contraseña de al menos 12 caracteres.');
        return 1;
    }
    if (User::where('role', 'admin')->exists()) {
        $this->info('Ya existe una cuenta administradora.');
        return 0;
    }
    User::updateOrCreate(['email' => $email], [
        'name' => $name,
        'password' => $password,
        'role' => 'admin',
        'active' => true,
    ]);
    $this->info('Cuenta administradora creada.');
    return 0;
})->purpose('Crea la primera cuenta administradora desde variables de entorno');
