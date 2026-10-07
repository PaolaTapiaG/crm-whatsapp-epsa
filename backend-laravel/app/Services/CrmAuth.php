<?php

namespace App\Services;

use App\Models\CrmAccessToken;
use App\Models\User;
use Illuminate\Support\Str;

class CrmAuth
{
    public function userFromToken(?string $plainToken): ?User
    {
        if (!$plainToken) return null;
        $token = CrmAccessToken::with('user')
            ->where('token_hash', hash('sha256', $plainToken))
            ->where('expires_at', '>', now())
            ->first();

        return $token?->user?->active ? $token->user : null;
    }

    public function issueToken(User $user): string
    {
        $plainToken = Str::random(64);
        CrmAccessToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addHours(max(1, (int) config('crm.session_hours'))),
        ]);
        return $plainToken;
    }

    public function revokeToken(?string $plainToken): void
    {
        if ($plainToken) {
            CrmAccessToken::where('token_hash', hash('sha256', $plainToken))->delete();
        }
    }
}
